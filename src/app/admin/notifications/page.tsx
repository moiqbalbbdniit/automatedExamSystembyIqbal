import type { FC } from 'react';
import AdminNotificationForm from '@/components/admin/AdminNotificationForm';
import Link from "next/link";
import {  ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
const AdminNotificationsPage: FC = () => {

  return (

    <div className="container mx-auto p-8 bg-slate-950">
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Admin Dashboard</h1>
       <Link href="/admin">
          <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full md:w-auto cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        </div>
      <AdminNotificationForm />
    </div>
  );
};

export default AdminNotificationsPage;