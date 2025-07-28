import { Routes, Route } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import RoomSelect from './pages/RoomSelect';
import Chat from './pages/Chat';

function App() {
  return (
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path="/signup" element={<Signup />} />
        <Route path='/select-room' element={<RoomSelect/>}/>
        <Route path='/chat' element={<Chat/>}/>
      </Routes>
  );
}

export default App;
