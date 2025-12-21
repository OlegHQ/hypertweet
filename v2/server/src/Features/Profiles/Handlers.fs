namespace HypertweetServer.Features.Profile

open Giraffe

type ModelDef = { ModelName: string }

module Handlers =
    let listModels = fun next ctx -> json [| { ModelName = "openai" } |] next ctx

