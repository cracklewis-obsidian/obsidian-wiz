import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ContentArea from './components/ContentArea'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ContentArea />} />
        <Route path="/*" element={<ContentArea />} />
      </Routes>
    </Layout>
  )
}
