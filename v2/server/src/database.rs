pub async fn init_db() -> Result<d1_rs::D1Client, Box<dyn std::error::Error + Send + Sync>> {
    let conn = rusqlite::Connection::open("db.sqlite3").unwrap();

    let db = d1_rs::D1Client::new_sqlite(conn);

    Ok(db)
}
