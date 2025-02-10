/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { createContext, useContext, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { IUser } from '@/interface/IUser';
import { Activity } from '@/interface/IActivity';
import { IProducts } from '@/interface/IProducts';
import { UserStatus } from '@/components/InfoAdmin/UsersTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Definir interfaz para órdenes
interface Order {
  id: string;
  userId: string;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
  total: number;
  status: string;
  createdAt: Date;
}

interface AdminContextType {
  users: IUser[];
  activities: Activity[];
  products: IProducts[];
  loading: boolean;
  error: string | null;

  // Funciones de Usuarios
  getAllUsers: () => Promise<IUser[]>;
  isRetired: (userId: string) => Promise<boolean>;
  isBan: (userId: string) => Promise<boolean>;
  isAdmin: (userId: string) => Promise<boolean>;

  // Funciones de Actividades
  getAllActivities: () => Promise<Activity[]>;
  getActivityById: (id: string) => Promise<Activity>;
  createActivity: (activityData: Omit<Activity, 'id'>) => Promise<void>;
  updateActivityRegistration: (id: string, activityData: Partial<Activity>) => Promise<void>;
  cancelActivity: (id: string) => Promise<void>;
  
  // Funciones de Productos
  getAllProducts: () => Promise<IProducts[]>;
  getProductById: (id: string) => Promise<IProducts>;
  createProduct: (productData: Omit<IProducts, 'id'>) => Promise<void>;
  updateProduct: (id: string, productData: Partial<IProducts>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Funciones de Órdenes
  getAllOrders: () => Promise<Order[]>;
  getOrderById: (id: string) => Promise<Order>;
  convertCartToOrder: (userId: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [products, setProducts] = useState<IProducts[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funciones de Usuarios
  const getAllUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token:', token);
  
      console.log('API_URL:', API_URL);
      console.log('Full request URL:', `${API_URL}/user`);
      console.log('Request headers:', { 'Authorization': `Bearer ${token}` });
  
      const response = await axios.get(`${API_URL}/user`, {
        params: { limit: 1000 },
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response data:', response.data);
  
      const usersList = response.data.users || response.data;
      console.log('Processed user list:', usersList);
  
      setUsers(usersList);
      setLoading(false);
      return usersList;
    } catch (error) {
      setLoading(false);
      console.error('Error in getAllUsers:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getUserById = async (userId: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/user/${userId}`);
      return data;
    } catch (error) {
      // Verificar si es un error de Axios
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message || error.message || 'Error al obtener usuario';
        throw new Error(errorMessage);
      }
      
      // Manejo de errores genéricos
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener usuario';
      
      throw new Error(errorMessage);
    }
  };

  

  const isRetired = async (userId: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/user/${userId}/isRetired`);
      return data;
    } catch (error) {
      throw new Error('Error al verificar estado de jubilación');
    }
  };

  const isBan = async (userId: string) => {
    try {
      const { data } = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/auth/${userId}`);
      
      // Actualizar el estado local de usuarios
      setUsers(users.map(user => 
        user.id === userId 
          ? {
              ...user, 
              userStatus: user.userStatus === UserStatus.ACTIVE 
                ? UserStatus.BANNED 
                : UserStatus.ACTIVE
            } 
          : user
      ));
  
      return data;
    } catch (error) {
      console.error('Error al cambiar estado del usuario:', error);
      throw error;
    }
  };

  const isAdmin = async (userId: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/user/${userId}/isAdmin`);
      return data;
    } catch (error) {
      throw new Error('Error al verificar si es administrador');
    }
  };

  // Funciones de Actividades (previous implementation remains the same)
  const getAllActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }
  
      const response = await axios.get(`${API_URL}/activity`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      // Log para ver la estructura exacta de la respuesta
      console.log('Estructura de response.data:', {
        type: typeof response.data,
        value: response.data
      });
  
      // Asegurarnos de que estamos manejando correctamente el array de actividades
      let activitiesArray;
      if (Array.isArray(response.data)) {
        activitiesArray = response.data;
      } else if (response.data.activities) {
        activitiesArray = response.data.activities;
      } else if (response.data.data) {
        activitiesArray = response.data.data;
      } else {
        activitiesArray = [];
        console.error('Estructura de datos inesperada:', response.data);
      }
  
      console.log('Array de actividades procesado:', activitiesArray);
  
      // Actualizar el estado solo si tenemos un array válido
      if (Array.isArray(activitiesArray)) {
        setActivities(activitiesArray);
      }
  
      return activitiesArray;
    } catch (error) {
      console.error('Error completo al obtener actividades:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalles del error Axios:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
          config: error.config
        });
      }
  
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al obtener actividades';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getActivityById = async (id: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/activity/${id}`);
      return data;
    } catch (error) {
      throw new Error('Error al obtener actividad');
    }
  };

  const createActivity = async (activityData: Omit<Activity, 'id'>): Promise<void> => {
    try {
      const maxPeopleValue = Number(activityData.maxPeople);
      if (isNaN(maxPeopleValue) || maxPeopleValue <= 0) {
        throw new Error("El número máximo de personas debe ser un valor mayor a 0.");
      }
  
      // Crear un FormData
      const formData = new FormData();
      formData.append('title', activityData.title);
      formData.append('description', activityData.description);
      formData.append('date', activityData.date);
      formData.append('hour', activityData.hour);
      formData.append('maxPeople', String(Number(maxPeopleValue))); // Asegurar que maxPeople es un string numérico
  
      if (activityData.file) {
        formData.append('file', activityData.file);
      }
  
      // Obtener el token desde localStorage (o donde sea que lo estés almacenando)
      const token = localStorage.getItem('token'); // Cambia esto según tu implementación
  
      // Verificar si el token existe
      if (!token) {
        throw new Error('No se encontró un token de autenticación.');
      }
  
      // Enviar la solicitud POST al backend con el token en los encabezados
      const response = await axios.post(`${API_URL}/activity/createActivity`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`, // Agregar el token al encabezado
        }
      });
  
      if (!response) {
        throw new Error(`Error al crear la actividad: ${response}`);
      }
  
      console.log('Actividad creada:', response.data);
      return response.data; // Retornar el resultado de la creación
  
    } catch (error) {
      console.error('Error al crear actividad:', error);
      if (error instanceof Error) {
        console.error('Detalles del error:', error.message);
      }
      throw error;
    }
  };
  
  
  
  


  const updateActivityRegistration = async (id: string, activityData: Partial<Activity>) => {
    try {
      const { data } = await axios.put(`${API_URL}/activity/toggle-registration/${id}`, activityData);
      setActivities(prev => prev.map(activity => activity.id === id ? data : activity));
    } catch (error) {
      throw new Error('Error al actualizar actividad');
    }
  };

  const cancelActivity = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      await axios.delete(`${API_URL}/activity/delete-activity/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      

      // Actualizar el estado local
      setActivities(prevActivities => 
        prevActivities.map(activity => 
          activity.id === id 
            ? { ...activity, status: false }
            : activity
        )
      );

    } catch (error) {
      console.error('Error al cancelar actividad:', error);
      throw error;
    }
};

  // Funciones de Productos (previous implementation remains the same)
  const getAllProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/product`);
      setProducts(data);
      return data;
    } catch (error) {
      throw new Error('Error al obtener productos');
    }
  };

  const getProductById = async (id: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/product/${id}`);
      return data;
    } catch (error) {
      throw new Error('Error al obtener producto');
    }
  };

  const createProduct = async (productData: Omit<IProducts, 'id'>) => {
    try {
      const { data } = await axios.post(`${API_URL}/product`, productData);
      setProducts(prev => [...prev, data]);
    } catch (error) {
      throw new Error('Error al crear producto');
    }
  };

  const updateProduct = async (id: string, productData: Partial<IProducts>) => {
    try {
      const { data } = await axios.put(`${API_URL}/product/${id}`, productData);
      setProducts(prev => prev.map(product => product.id === id ? data : product));
    } catch (error) {
      throw new Error('Error al actualizar producto');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/product/${id}`);
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (error) {
      throw new Error('Error al eliminar producto');
    }
  };

  // Funciones de Órdenes
  const getAllOrders = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/order/allOrders`);
      return data;
    } catch (error) {
      throw new Error('Error al obtener órdenes');
    }
  };

  const getOrderById = async (id: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/order/${id}`);
      return data;
    } catch (error) {
      throw new Error('Error al obtener orden');
    }
  };

  const convertCartToOrder = async (userId: string) => {
    try {
      await axios.post(`${API_URL}/order/${userId}/convert-cart`);
    } catch (error) {
      throw new Error('Error al convertir carrito en orden');
    }
  };

  const value = {
    users,
    activities,
    products,
    loading,
    error,
    // Añadir nuevas funciones de usuario
    getAllUsers,
    isRetired,
    isBan,
    isAdmin,
    // Funciones de Actividades
    getAllActivities,
    getActivityById,
    createActivity,
    updateActivityRegistration,
    cancelActivity,
    // Funciones de Productos
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    // Funciones de Órdenes
    getAllOrders,
    getOrderById,
    convertCartToOrder
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}