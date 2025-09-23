use crate::models;

pub async fn init_db() -> anyhow::Result<d1_rs::D1Client> {
    let conn = rusqlite::Connection::open("db.sqlite3").unwrap();
    let db = d1_rs::D1Client::new_sqlite(conn);
    let ac = d1_rs::auto_migration::AutoSchemaClient::new(db.clone());
    ac.register_entity::<models::User>()?;
    ac.auto_migrate().await?;
    Ok(db)
}
