"use client"

import { useState, useEffect, useCallback } from "react"
import { SessionStats } from "./SessionStats"
import { PomodoroTimer } from "./PomodoroTimer"
import { AmbientPlayer } from "./AmbientPlayer"
import { Scratchpad } from "./Scratchpad"
import { TodoList } from "./TodoList"
import { SessionPlanner } from "./SessionPlanner"

const STATS_KEY = () => `prepiq:study-stats:${new Date().toISOString().slice(0, 10)}`
const TODOS_KEY = "prepiq:study-todos"

type Stats = { sessions: number; focusSecs: number }

function loadStats(): Stats {
  try {
    const raw = JSON.parse(localStorage.getItem(STATS_KEY()) ?? "{}")
    return { sessions: raw.sessions ?? 0, focusSecs: raw.focusSecs ?? 0 }
  } catch { return { sessions: 0, focusSecs: 0 } }
}

function saveStats(s: Stats) {
  localStorage.setItem(STATS_KEY(), JSON.stringify(s))
}

function countDoneTodos(): number {
  try {
    const todos = JSON.parse(localStorage.getItem(TODOS_KEY) ?? "[]") as { done: boolean }[]
    return todos.filter((t) => t.done).length
  } catch { return 0 }
}

export function StudyRoomClient() {
  const [stats, setStats]       = useState<Stats>({ sessions: 0, focusSecs: 0 })
  const [tasksDone, setTasksDone] = useState(0)
  const [inject, setInject]     = useState<{ tasks: string[]; version: number }>({ tasks: [], version: 0 })

  useEffect(() => {
    setStats(loadStats())
    setTasksDone(countDoneTodos())
  }, [])

  const handleFocusComplete = useCallback((secs: number) => {
    setStats((prev) => {
      const next = { sessions: prev.sessions + 1, focusSecs: prev.focusSecs + secs }
      saveStats(next)
      return next
    })
  }, [])

  const handleTaskToggle = useCallback(() => {
    setTasksDone(countDoneTodos())
  }, [])

  const handleInject = useCallback((tasks: string[]) => {
    setInject({ tasks, version: Date.now() })
  }, [])

  return (
    <div className="space-y-5">
      <SessionPlanner onInject={handleInject} />
      <SessionStats
        focusSecs={stats.focusSecs}
        sessions={stats.sessions}
        tasksDone={tasksDone}
      />
      <PomodoroTimer onFocusComplete={handleFocusComplete} />
      <AmbientPlayer />
      <Scratchpad />
      <TodoList onToggle={handleTaskToggle} inject={inject} />
    </div>
  )
}
