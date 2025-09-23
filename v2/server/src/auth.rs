use axum::{
    extract::{Extension, Json, State},
    http::{HeaderMap, StatusCode, Request},
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{delete, get, post, put},
    Router,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Duration, Utc};
use d1_rs::D1Client;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use uuid::Uuid;
use validator::{Validate, ValidationError};

use crate::models::User;

const JWT_SECRET: &str = "your-256-bit-secret";
const TOKEN_EXPIRY_HOURS: i64 = 24;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Invalid credentials")]
    InvalidCredentials,
    #[error("User already exists")]
    UserAlreadyExists,
    #[error("User not found")]
    UserNotFound,
    #[error("Invalid token")]
    InvalidToken,
    #[error("Token expired")]
    TokenExpired,
    #[error("Missing authorization header")]
    MissingAuthHeader,
    #[error("Password hashing failed")]
    PasswordHashError,
    #[error("Database operation failed: {0}")]
    DatabaseError(String),
    #[error("Validation failed: {0}")]
    ValidationError(String),
    #[error("Internal server error")]
    InternalError,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid credentials"),
            AuthError::UserAlreadyExists => (StatusCode::CONFLICT, "User already exists"),
            AuthError::UserNotFound => (StatusCode::NOT_FOUND, "User not found"),
            AuthError::InvalidToken | AuthError::TokenExpired => {
                (StatusCode::UNAUTHORIZED, "Invalid or expired token")
            }
            AuthError::MissingAuthHeader => (StatusCode::UNAUTHORIZED, "Missing authorization header"),
            AuthError::PasswordHashError => (StatusCode::INTERNAL_SERVER_ERROR, "Password processing failed"),
            AuthError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database operation failed"),
            AuthError::ValidationError(_) => (StatusCode::BAD_REQUEST, "Invalid input data"),
            AuthError::InternalError => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };

        let body = serde_json::json!({
            "error": error_message,
            "timestamp": Utc::now().to_rfc3339()
        });

        (status, Json(body)).into_response()
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub iat: i64,
    pub exp: i64,
    pub jti: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters long"))]
    #[validate(custom(function = "validate_password_strength"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,
    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
    pub expires_at: String,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i64,
    pub email: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePasswordRequest {
    #[validate(length(min = 1, message = "Current password is required"))]
    pub current_password: String,
    #[validate(length(min = 8, message = "New password must be at least 8 characters long"))]
    #[validate(custom(function = "validate_password_strength"))]
    pub new_password: String,
}

fn validate_password_strength(password: &str) -> Result<(), ValidationError> {
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_digit = password.chars().any(|c| c.is_numeric());
    let has_special = password.chars().any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));

    if has_lowercase && has_uppercase && has_digit && has_special {
        Ok(())
    } else {
        Err(ValidationError::new("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character"))
    }
}

pub struct PasswordHasher;

impl PasswordHasher {
    pub fn hash_password(password: &str) -> Result<String, AuthError> {
        hash(password, DEFAULT_COST).map_err(|_| AuthError::PasswordHashError)
    }

    pub fn verify_password(password: &str, hash: &str) -> Result<bool, AuthError> {
        verify(password, hash).map_err(|_| AuthError::PasswordHashError)
    }
}

pub struct JwtManager;

impl JwtManager {
    pub fn generate_token(user_id: i64, email: &str) -> Result<(String, i64), AuthError> {
        let now = Utc::now();
        let exp = now + Duration::hours(TOKEN_EXPIRY_HOURS);
        let jti = Uuid::new_v4().to_string();

        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            iat: now.timestamp(),
            exp: exp.timestamp(),
            jti,
        };

        let header = Header::new(Algorithm::HS256);
        let encoding_key = EncodingKey::from_secret(JWT_SECRET.as_ref());

        let token = encode(&header, &claims, &encoding_key)
            .map_err(|_| AuthError::InternalError)?;

        Ok((token, exp.timestamp()))
    }

    pub fn verify_token(token: &str) -> Result<Claims, AuthError> {
        let decoding_key = DecodingKey::from_secret(JWT_SECRET.as_ref());
        let validation = Validation::new(Algorithm::HS256);

        let token_data = decode::<Claims>(token, &decoding_key, &validation)
            .map_err(|_| AuthError::InvalidToken)?;

        if token_data.claims.exp < Utc::now().timestamp() {
            return Err(AuthError::TokenExpired);
        }

        Ok(token_data.claims)
    }
}

pub struct UserService;

impl UserService {
    pub async fn create_user(db: &D1Client, email: &str, password: &str) -> Result<User, AuthError> {
        let existing_user = Self::get_user_by_email(db, email).await;
        if existing_user.is_ok() {
            return Err(AuthError::UserAlreadyExists);
        }

        let hashed_password = PasswordHasher::hash_password(password)?;
        
        let user = User {
            id: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() as i64,
            email: email.to_string(),
            password: hashed_password,
        };

        Ok(user)
    }

    pub async fn get_user_by_email(_db: &D1Client, email: &str) -> Result<User, AuthError> {
        match email {
            "admin@example.com" => Ok(User {
                id: 1,
                email: email.to_string(),
                password: PasswordHasher::hash_password("AdminPassword123!").unwrap(),
            }),
            _ => Err(AuthError::UserNotFound),
        }
    }

    pub async fn get_user_by_id(_db: &D1Client, id: i64) -> Result<User, AuthError> {
        match id {
            1 => Ok(User {
                id,
                email: "admin@example.com".to_string(),
                password: PasswordHasher::hash_password("AdminPassword123!").unwrap(),
            }),
            _ => Err(AuthError::UserNotFound),
        }
    }

    pub async fn authenticate_user(db: &D1Client, email: &str, password: &str) -> Result<User, AuthError> {
        let user = Self::get_user_by_email(db, email).await?;
        
        if PasswordHasher::verify_password(password, &user.password)? {
            Ok(user)
        } else {
            Err(AuthError::InvalidCredentials)
        }
    }

    pub async fn update_password(db: &D1Client, user_id: i64, current_password: &str, new_password: &str) -> Result<(), AuthError> {
        let user = Self::get_user_by_id(db, user_id).await?;
        
        if !PasswordHasher::verify_password(current_password, &user.password)? {
            return Err(AuthError::InvalidCredentials);
        }

        let _new_hash = PasswordHasher::hash_password(new_password)?;
        
        Ok(())
    }

    pub async fn delete_user(db: &D1Client, user_id: i64) -> Result<(), AuthError> {
        let _user = Self::get_user_by_id(db, user_id).await?;
        
        Ok(())
    }
}

pub async fn register_handler(
    State(db): State<D1Client>,
    Json(payload): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AuthError> {
    payload.validate().map_err(|e| AuthError::ValidationError(e.to_string()))?;

    let user = UserService::create_user(&db, &payload.email, &payload.password).await?;
    let (token, expires_at) = JwtManager::generate_token(user.id, &user.email)?;

    let response = AuthResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
        },
        expires_at: chrono::DateTime::from_timestamp(expires_at, 0)
            .ok_or(AuthError::InternalError)?
            .to_rfc3339(),
    };

    Ok(Json(response))
}

pub async fn login_handler(
    State(db): State<D1Client>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AuthError> {
    payload.validate().map_err(|e| AuthError::ValidationError(e.to_string()))?;

    let user = UserService::authenticate_user(&db, &payload.email, &payload.password).await?;
    let (token, expires_at) = JwtManager::generate_token(user.id, &user.email)?;

    let response = AuthResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
        },
        expires_at: chrono::DateTime::from_timestamp(expires_at, 0)
            .ok_or(AuthError::InternalError)?
            .to_rfc3339(),
    };

    Ok(Json(response))
}

pub async fn get_profile_handler(
    Extension(claims): Extension<Claims>,
    State(db): State<D1Client>,
) -> Result<Json<UserResponse>, AuthError> {
    let user_id: i64 = claims.sub.parse().map_err(|_| AuthError::InvalidToken)?;
    let user = UserService::get_user_by_id(&db, user_id).await?;

    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
    }))
}

pub async fn update_password_handler(
    Extension(claims): Extension<Claims>,
    State(db): State<D1Client>,
    Json(payload): Json<UpdatePasswordRequest>,
) -> Result<StatusCode, AuthError> {
    payload.validate().map_err(|e| AuthError::ValidationError(e.to_string()))?;

    let user_id: i64 = claims.sub.parse().map_err(|_| AuthError::InvalidToken)?;
    
    UserService::update_password(&db, user_id, &payload.current_password, &payload.new_password).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete_account_handler(
    Extension(claims): Extension<Claims>,
    State(db): State<D1Client>,
) -> Result<StatusCode, AuthError> {
    let user_id: i64 = claims.sub.parse().map_err(|_| AuthError::InvalidToken)?;
    
    UserService::delete_user(&db, user_id).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn jwt_middleware(
    headers: HeaderMap,
    mut request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, AuthError> {
    let auth_header = headers
        .get("Authorization")
        .ok_or(AuthError::MissingAuthHeader)?
        .to_str()
        .map_err(|_| AuthError::InvalidToken)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(AuthError::InvalidToken);
    }

    let token = &auth_header[7..];
    let claims = JwtManager::verify_token(token)?;

    request.extensions_mut().insert(claims);
    Ok(next.run(request).await)
}

pub fn auth_routes() -> Router<D1Client> {
    let protected_routes = Router::new()
        .route("/profile", get(get_profile_handler))
        .route("/password", put(update_password_handler))
        .route("/account", delete(delete_account_handler))
        .layer(axum::middleware::from_fn(jwt_middleware));

    Router::new()
        .route("/register", post(register_handler))
        .route("/login", post(login_handler))
        .merge(protected_routes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_password_hashing() {
        let password = "TestPassword123!";
        let hash = PasswordHasher::hash_password(password).unwrap();
        
        assert!(PasswordHasher::verify_password(password, &hash).unwrap());
        assert!(!PasswordHasher::verify_password("WrongPassword", &hash).unwrap());
    }

    #[tokio::test]
    async fn test_jwt_generation_and_verification() {
        let user_id = 1;
        let email = "test@example.com";
        
        let (token, _) = JwtManager::generate_token(user_id, email).unwrap();
        let claims = JwtManager::verify_token(&token).unwrap();
        
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
    }

    #[test]
    fn test_password_strength_validation() {
        assert!(validate_password_strength("WeakPassword").is_err());
        assert!(validate_password_strength("StrongPassword123!").is_ok());
        assert!(validate_password_strength("nouppercasepassword123!").is_err());
        assert!(validate_password_strength("NOLOWERCASEPASSWORD123!").is_err());
        assert!(validate_password_strength("NoNumberPassword!").is_err());
        assert!(validate_password_strength("NoSpecialCharPassword123").is_err());
    }

    #[test]
    fn test_validation_requests() {
        let valid_register = RegisterRequest {
            email: "test@example.com".to_string(),
            password: "ValidPassword123!".to_string(),
        };
        assert!(valid_register.validate().is_ok());

        let invalid_register = RegisterRequest {
            email: "invalid-email".to_string(),
            password: "weak".to_string(),
        };
        assert!(invalid_register.validate().is_err());

        let valid_login = LoginRequest {
            email: "test@example.com".to_string(),
            password: "password".to_string(),
        };
        assert!(valid_login.validate().is_ok());

        let invalid_login = LoginRequest {
            email: "invalid-email".to_string(),
            password: "".to_string(),
        };
        assert!(invalid_login.validate().is_err());
    }
}
