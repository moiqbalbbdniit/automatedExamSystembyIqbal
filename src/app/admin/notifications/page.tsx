import type { FC } from 'react';
import AdminNotificationForm from '@/components/admin/AdminNotificationForm';
import Link from "next/link";
import {  ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
const AdminNotificationsPage: FC = () => {

  return (

    <div className="container mx-auto aurora-page p-8">
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6'>
      <h1 className="text-3xl font-bold mb-6 text-primary">Admin Dashboard</h1>
       <Link href="/admin">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/85 w-full md:w-auto cursor-pointer text-primary-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        </div>
      <div className="panel p-4 md:p-6">
        <AdminNotificationForm />
      </div>
    </div>
  );
};

export default AdminNotificationsPage;