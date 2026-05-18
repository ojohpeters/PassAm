"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react"

type Todo = { id: string; text: string; done: boolean }

const KEY = "prepiq:study-todos"

function load(): Todo[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") } catch { return [] }
}

export function TodoList({
  onToggle,
  inject,
}: {
  onToggle?: () => void
  inject?: { tasks: string[]; version: number }
} = {}) {
  const [todos, setTodos]     = useState<Todo[]>([])
  const [input, setInput]     = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTodos(load()); setMounted(true) }, [])
  useEffect(() => {
    if (mounted) localStorage.setItem(KEY, JSON.stringify(todos))
  }, [todos, mounted])

  // Inject tasks from the session planner (de-duped, prepended)
  useEffect(() => {
    if (!inject?.tasks.length) return
    setTodos((prev) => {
      const existingTexts = new Set(prev.map((t) => t.text))
      const newItems = inject.tasks
        .filter((text) => !existingTexts.has(text))
        .map((text) => ({ id: crypto.randomUUID(), text, done: false }))
      return newItems.length ? [...newItems, ...prev] : prev
    })
  }, [inject?.version]) // eslint-disable-line

  function add() {
    const text = input.trim()
    if (!text) return
    setTodos((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }])
    setInput("")
  }

  function toggle(id: string) {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t))
    setTimeout(() => onToggle?.(), 0)
  }

  function remove(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  function clearDone() {
    setTodos((prev) => prev.filter((t) => !t.done))
  }

  const doneCount = todos.filter((t) => t.done).length

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tasks</h2>
        {doneCount > 0 && (
          <button
            onClick={clearDone}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear done
          </button>
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task and press Enter…"
          className="flex-1 rounded-xl border bg-muted/30 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground ring-primary/40 focus:border-primary focus:ring-2"
        />
        <button
          onClick={add}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* List */}
      {todos.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No tasks yet — add something to focus on!
        </p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="group flex items-center gap-3 rounded-xl border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <button
                onClick={() => toggle(todo.id)}
                className="shrink-0 transition-colors"
              >
                {todo.done
                  ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                }
              </button>

              <span className={cn(
                "flex-1 text-sm leading-snug",
                todo.done && "line-through text-muted-foreground"
              )}>
                {todo.text}
              </span>

              <button
                onClick={() => remove(todo.id)}
                className="shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {todos.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${todos.length > 0 ? (doneCount / todos.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground shrink-0">
            {doneCount}/{todos.length}
          </span>
        </div>
      )}
    </div>
  )
}
