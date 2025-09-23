use std::net::SocketAddr;
mod database;
mod models;
mod auth;

use axum::{Router, routing::get, Json};
use serde_json::{json, Value};
use tower_http::cors::CorsLayer;
use chrono::Utc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let db = database::init_db().await?;

    let app = Router::new()
        .route("/", get(health_handler))
        .nest("/auth", auth::auth_routes())
        .with_state(db)
        .layer(CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running on http://0.0.0.0:3000");
    
    axum::serve(tokio::net::TcpListener::bind(&addr).await?, app)
        .await?;
    
    Ok(())
}

async fn health_handler() -> Json<Value> {
    Json(json!({
        "status": "healthy",
        "service": "hypertweet-auth-server",
        "version": "0.1.0",
        "timestamp": Utc::now().to_rfc3339()
    }))
}
