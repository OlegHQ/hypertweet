use d1_rs::Entity;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Entity, PartialEq)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub password: String,
}
