namespace HypertweetServer.Infrastructure

open MongoDB.Driver
open HypertweetServer.Shared

module Database =
    let connect (config: AppConfig) =
        let client = MongoClient config.MongoConnectionString
        client.GetDatabase config.DatabaseName
