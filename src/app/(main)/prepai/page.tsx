import { getApiKeys, loadChatHistory } from "@/actions/user-questions.actions"
import type { StoredMessage } from "@/actions/user-questions.actions"
import { PrepAIClient } from "./PrepAIClient"

export default async function PrepAIPage() {
  const [keys, historyResult] = await Promise.all([getApiKeys(), loadChatHistory()])
  const history: StoredMessage[] = historyResult.success ? historyResult.messages : []

  return (
    <PrepAIClient
      initialGeminiKey={keys.geminiKey}
      initialGroqKey={keys.groqKey}
      initialDeepseekKey={keys.deepseekKey}
      initialHistoryDays={keys.chatHistoryDays}
      initialHistory={history}
    />
  )
}
