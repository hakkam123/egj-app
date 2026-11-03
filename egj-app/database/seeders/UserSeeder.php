<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed akun Admin JAGO.
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
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['npk' => $userData['npk']],
                $userData
            );
        }
    }
}
