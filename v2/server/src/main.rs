use std::net::SocketAddr;
mod database;
mod models;

use axum::{Router, routing::get};

#[tokio::main]
async fn main() {
    let app = Router::new().route("/", get(handler));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    axum::serve(tokio::net::TcpListener::bind(&addr).await.unwrap(), app)
        .await
        .unwrap();
}

async fn handler() -> &'static str {
    "hey"
}
