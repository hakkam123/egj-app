<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeederTambahan extends Seeder
{
    /**
     * Seed tambahan: Alya, Destya, Vira, Alisa Haqiqi Jusuf.
     * Dijalankan terpisah dari UserSeeder:
     *   php artisan db:seed --class=UserSeederTambahan
     */
    public function run(): void
    {
        $users = [
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
