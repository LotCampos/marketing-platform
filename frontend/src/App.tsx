import AppRouter from './app/AppRouter'
import { QueryProvider } from './app/QueryProvider'

import './App.css'

function App() {
  return (
    <QueryProvider>
      <AppRouter />
    </QueryProvider>
  )
}

export default App