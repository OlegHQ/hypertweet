import { createProxyHandler } from "../data/proxy-handler"
import type { App } from "../data"
import { browserApi } from "../browser-api"
import { useState } from "react"

const app = createProxyHandler<App>(async (path, args) => {
    return await browserApi.runtime.sendMessage({ name: "proxy", path, args })
})
export default function SidebarUI() {
    const [result, setResult] = useState<number | null>(null)
    return (
        <div className="text-3xl font-bold underline">
            <h1>Hello world: {result}!</h1>
            <button onClick={async () => {
                const result = await app.testStuff()
                setResult(result)
            }}>Test</button>
        </div>
    )
}
