import './index.css'
import { Provider } from './state'
import TabsBar from './components/TabsBar'
import Toolbar from './components/Toolbar'
import Whiteboard from './Whiteboard/Whiteboard'

export default function App(){
  return (
    <Provider>
      <div className="app">
        <TabsBar/>
        <Toolbar/>
        <Whiteboard/>
      </div>
    </Provider>
  )
}
