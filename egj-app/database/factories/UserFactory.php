<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'npk' => (string) fake()->unique()->numberBetween(2000, 999999),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'Staff',
            'is_active' => true,
            'is_default_approver' => false,
        ];
    }

    public function staff(): static
    {
        return $this->state(fn () => ['role' => 'Staff']);
    }

    public function sectionHead(bool $default = true): static
    {
        return $this->state(fn () => ['role' => 'Section Head', 'is_default_approver' => $default]);
    }

    public function deptHead(): static
    {
        return $this->state(fn () => ['role' => 'Dept/Div Head']);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'Admin']);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
