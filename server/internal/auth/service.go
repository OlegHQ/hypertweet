package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	secret                 string
	issuer                 string
	audience               string
	expiryDays             int
	refreshTokenExpiryDays int
}

func NewAuthService(secret, issuer, audience string, expiryDays, refreshTokenExpiryDays int) *AuthService {
	return &AuthService{
		secret:                 secret,
		issuer:                 issuer,
		audience:               audience,
		expiryDays:             expiryDays,
		refreshTokenExpiryDays: refreshTokenExpiryDays,
	}
}

func (s *AuthService) RefreshTokenExpiry() time.Duration {
	return time.Duration(s.refreshTokenExpiryDays) * 24 * time.Hour
}

func (s *AuthService) GenerateTokens(user *User) (*TokenResult, error) {
	accessToken, err := s.generateAccessToken(user)
	if err != nil {
		return nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := generateRefreshToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	return &TokenResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    s.expiryDays * 24 * 60 * 60,
	}, nil
}

func (s *AuthService) generateAccessToken(user *User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"iss":   s.issuer,
		"aud":   s.audience,
		"exp":   time.Now().Add(time.Duration(s.expiryDays) * 24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

func generateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hash), nil
}

func VerifyPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}
