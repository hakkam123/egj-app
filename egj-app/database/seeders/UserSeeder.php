<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed sample users for all roles.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin JAGO',
                'email' => 'admin@astra-visteon.com',
                'npk' => '1001',
                'password' => 'password123',
                'role' => 'Admin',
                'is_active' => true,
                'is_default_approver' => false,
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@astra-visteon.com',
                'npk' => '1002',
                'password' => 'password123',
                'role' => 'Staff',
                'is_active' => true,
                'is_default_approver' => false,
            ],
            [
                'name' => 'Siti Rahayu',
                'email' => 'siti.rahayu@astra-visteon.com',
                'npk' => '1003',
                'password' => 'password123',
                'role' => 'Staff',
                'is_active' => true,
                'is_default_approver' => false,
            ],
            [
                'name' => 'Ahmad Hidayat',
                'email' => 'devhiraethtys@gmail.com',
                'npk' => '1004',
                'password' => 'password123',
                'role' => 'Section Head',
                'is_active' => true,
                'is_default_approver' => true,
            ],
            [
                'name' => 'Alisa Wijaya',
                'email' => 'cokotbara@gmail.com',
                'npk' => '1005',
                'password' => 'password123',
                'role' => 'Dept/Div Head',
                'is_active' => true,
                'is_default_approver' => true,
            ],
            [
                'name' => 'Alya Hasna Asyifa',
                'email' => 'alya.hasna@astra-visteon.com',
                'npk' => '0879',
                'password' => 'Avi123!',
                'role' => 'Staff',
                'is_active' => true,
                'is_default_approver' => false,
            ],
            [
                'name' => 'Destya Ardi Wijayanti',
                'email' => 'destya.ardi@astra-visteon.com',
                'npk' => '0568',
                'password' => 'Avi123!',
                'role' => 'Section Head',
                'is_active' => true,
                'is_default_approver' => false,
            ],
            [
                'name' => 'Vira Puspa Anggraini',
                'email' => 'vira.puspa@astra-visteon.com',
                'npk' => '0836',
                'password' => 'Avi123!',
                'role' => 'Section Head',
                'is_active' => true,
                'is_default_approver' => false,
            ],
            [
                'name' => 'Alisa Haqiqi Jusuf',
                'email' => 'alisa.haqiqi@astra-visteon.com',
                'npk' => '0791',
                'password' => 'Avi123!',
                'role' => 'Dept/Div Head',
                'is_active' => true,
                'is_default_approver' => false,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['npk' => $userData['npk']],
                $userData
            );
        }
    }
}
