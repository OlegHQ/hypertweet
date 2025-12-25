module Base.Bson

open MongoDB.Bson
open MongoDB.Bson.Serialization
open MongoDB.Bson.Serialization.Serializers

type OptionSerializer<'T>() =
    inherit SerializerBase<'T option>()

    let innerSerializer = lazy BsonSerializer.LookupSerializer<'T>()

    override _.Serialize(ctx, args, value) =
        match value with
        | Some v -> (innerSerializer.Value :> IBsonSerializer<'T>).Serialize(ctx, args, v)
        | None -> ctx.Writer.WriteNull()

    override _.Deserialize(ctx, args) =
        if ctx.Reader.GetCurrentBsonType() = BsonType.Null then
            ctx.Reader.ReadNull()
            None
        else
            Some((innerSerializer.Value :> IBsonSerializer<'T>).Deserialize(ctx, args))

type ListSerializer<'T>() =
    inherit SerializerBase<'T list>()

    let innerSerializer = lazy BsonSerializer.LookupSerializer<'T>()

    override _.Serialize(ctx, args, value) =
        ctx.Writer.WriteStartArray()

        for item in value do
            (innerSerializer.Value :> IBsonSerializer<'T>).Serialize(ctx, args, item)

        ctx.Writer.WriteEndArray()

    override _.Deserialize(ctx, args) =
        ctx.Reader.ReadStartArray()
        let items = ResizeArray<'T>()

        while ctx.Reader.ReadBsonType() <> BsonType.EndOfDocument do
            items.Add((innerSerializer.Value :> IBsonSerializer<'T>).Deserialize(ctx, args))

        ctx.Reader.ReadEndArray()
        items |> Seq.toList

type FSharpSerializationProvider() =
    interface IBsonSerializationProvider with
        member _.GetSerializer(t: System.Type) =
            if t.IsGenericType then
                let genericDef = t.GetGenericTypeDefinition()
                let innerType = t.GetGenericArguments().[0]

                if genericDef = typedefof<option<_>> then
                    typedefof<OptionSerializer<_>>.MakeGenericType(innerType)
                    |> System.Activator.CreateInstance
                    :?> IBsonSerializer
                elif genericDef = typedefof<list<_>> then
                    typedefof<ListSerializer<_>>.MakeGenericType(innerType)
                    |> System.Activator.CreateInstance
                    :?> IBsonSerializer
                else
                    null
            else
                null

let mutable private registered = false

let registerSerializers () =
    if not registered then
        BsonSerializer.RegisterSerializationProvider(FSharpSerializationProvider())
        registered <- true

do registerSerializers ()

let make () = BsonDocument()
let field key value (doc: BsonDocument) = doc.Add(key, BsonValue.Create value)

let optionField key value (doc: BsonDocument) =
    match value with
    | Some v -> doc.Add(key, BsonValue.Create v)
    | None -> doc
