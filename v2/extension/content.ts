import { Router } from "./router";

const router = new Router()


const page = router.getScraper().readPage()

console.log("here's your page", page)

