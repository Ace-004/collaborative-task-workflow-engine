import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import authRoutes from './routes/auth.routes.js'

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/auth',authRoutes);

const PORT=process.env.PORT || 3001;

app.listen(PORT,()=>{
  console.log(`server running on port${PORT}`);
});

