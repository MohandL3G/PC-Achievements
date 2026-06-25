import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { Header } from "./Header"

describe("Header", () => {
  const defaultProps = {
    isLoggedIn: false,
    isBatchMode: false,
    searchTerm: "",
    sortType: "last_added",
    gamesCount: 5,
    filteredCount: 5,
    selectedCount: 0,
    isUpdatingBulk: false,
    onSearchChange: () => {},
    onSortChange: () => {},
    onLoginClick: () => {},
    onLogout: () => {},
    onAddGameClick: () => {},
    onStatsClick: () => {},
    onToggleBatchMode: () => {},
    onFetchPlaytimeUpdates: () => {},
    onSyncAchievements: () => {},
    onBulkDelete: () => {},
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ adminUsername: "testuser" }),
    })
  })

  it("renders the username from config", async () => {
    render(<Header {...defaultProps} />)
    await waitFor(() => expect(screen.getByText("testuser")).toBeDefined())
  })

  it("shows SIGN IN when not logged in", () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText("SIGN IN")).toBeDefined()
  })

  it("shows ADD GAME and LOGOUT when logged in", () => {
    render(<Header {...defaultProps} isLoggedIn={true} />)
    expect(screen.getByText("ADD GAME")).toBeDefined()
    expect(screen.getByText("LOGOUT")).toBeDefined()
  })

  it("shows total completed games count", () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByText(/TOTAL COMPLETED GAMES: 5/)).toBeDefined()
  })

  it("shows search input", () => {
    render(<Header {...defaultProps} />)
    expect(screen.getByPlaceholderText("Search games...")).toBeDefined()
  })
})