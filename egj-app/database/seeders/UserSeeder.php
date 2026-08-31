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
                'name' => 'Admin GJAS',
                'email' => 'admin@astra-visteon.com',
                'npk' => '10001',
                'password' => 'password123',
                'role' => 'Admin',
                'is_active' => true,
            ],
            [
                'name' => 'Budi Santoso',
                'email' => 'budi.santoso@astra-visteon.com',
                'npk' => '10002',
                'password' => 'password123',
                'role' => 'Staff',
                'is_active' => true,
            ],
            [
                'name' => 'Siti Rahayu',
                'email' => 'siti.rahayu@astra-visteon.com',
                'npk' => '10003',
                'password' => 'password123',
                'role' => 'Staff',
                'is_active' => true,
            ],
            [
                'name' => 'Ahmad Hidayat',
                'email' => 'ahmad.hidayat@astra-visteon.com',
                'npk' => '10004',
                'password' => 'password123',
                'role' => 'Section Head',
                'is_active' => true,
            ],
            [
                'name' => 'Alisa Wijaya',
                'email' => 'alisa.wijaya@astra-visteon.com',
                'npk' => '10005',
                'password' => 'password123',
                'role' => 'Dept/Div Head',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
