<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeederTambahan extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Esther Gabriela Rachel Lintang',
                'email' => 'esther.lintang@astra-visteon.com',
                'npk' => '0880',
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
                'is_default_approver' => true,
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
                'name' => 'Rio Qodro',
                'email' => 'rio.qodro@astra-visteon.com',
                'npk' => '0998',
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
