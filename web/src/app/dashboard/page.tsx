'use client'

import { Settings } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEngineState } from '@/lib/use-engine-state'

import { AssetsTab } from './_components/assets-tab'
import { ConflictBanner } from './_components/conflict-banner'
import { DebtsTab } from './_components/debts-tab'
import { ExpensesTab } from './_components/expenses-tab'
import { IncomesTab } from './_components/incomes-tab'
import { OfflineBanner } from './_components/offline-banner'
import { PaycheckTab } from './_components/paycheck-tab'
import { RecommendationsTab } from './_components/recommendations-tab'
import { SummarySidebar } from './_components/summary-sidebar'

export default function DashboardPage() {
  const { state, output, updateBlob, acceptServer, keepMine } = useEngineState()

  if (state.status === 'loading' || !output) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  const blocked = output.blockers.length > 0
  const blockerCount = output.blockers.length

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <h1 className="text-base font-semibold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={async () => {
              await fetch('/api/auth/sign-out', { method: 'POST' })
              window.location.href = '/login'
            }}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground transition hover:border-border-strong hover:bg-surface-2"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        <main className="p-6">
          {blocked ? (
            <Badge variant="destructive" className="mb-4">
              <a href="#tab-recommendations">Setup: {blockerCount} left</a>
            </Badge>
          ) : null}

          {state.status === 'conflict' && state.conflictBlob && state.conflictVersion != null ? (
            <ConflictBanner
              conflictBlob={state.conflictBlob}
              conflictVersion={state.conflictVersion}
              onAcceptServer={acceptServer}
              onKeepMine={keepMine}
            />
          ) : null}

          {state.status === 'offline' ? <OfflineBanner /> : null}

          <Tabs defaultValue="recommendations">
            <TabsList>
              <TabsTrigger value="paycheck">Paycheck</TabsTrigger>
              <TabsTrigger value="incomes">Incomes</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="recommendations" id="tab-recommendations">
                Recommendations
                {blocked ? <Settings className="ml-1 inline h-3 w-3" /> : null}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="paycheck">
              <PaycheckTab blob={state.blob} update={updateBlob} />
            </TabsContent>
            <TabsContent value="incomes">
              <IncomesTab blob={state.blob} update={updateBlob} />
            </TabsContent>
            <TabsContent value="expenses">
              <ExpensesTab blob={state.blob} update={updateBlob} />
            </TabsContent>
            <TabsContent value="assets">
              <AssetsTab blob={state.blob} update={updateBlob} />
            </TabsContent>
            <TabsContent value="debts">
              <DebtsTab blob={state.blob} update={updateBlob} />
            </TabsContent>
            <TabsContent value="recommendations">
              <RecommendationsTab output={output} blob={state.blob} update={updateBlob} />
            </TabsContent>
          </Tabs>

          <footer className="mt-12 text-xs text-muted-foreground">
            Engine {output.engineVersion} · Tax year {output.taxYear}
          </footer>
        </main>

        <aside className="border-t border-border p-6 lg:border-t-0 lg:border-l">
          <SummarySidebar metrics={output.metrics} />
        </aside>
      </div>
    </div>
  )
}
