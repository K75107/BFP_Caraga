import { configureStore } from '@reduxjs/toolkit'
import {userReducer} from './routes/Authentication/authSlice'


export default configureStore({
  reducer: {
    auth: userReducer,


  },
})