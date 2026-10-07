import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '@/Pages/Auth/Login';
import { lastVisit, setPageProps } from './helpers';

describe('Login page', () => {
    it('posts NPK and password to /login', async () => {
        const user = userEvent.setup();
        render(<Login />);

        await user.type(screen.getByLabelText(/Employee ID/i), '1002');
        await user.type(screen.getByLabelText(/^Password/i), 'secret123');
        await user.click(screen.getByRole('button', { name: 'Sign In' }));

        expect(lastVisit()).toMatchObject({ url: '/login', method: 'post', data: { npk: '1002', password: 'secret123' } });
    });

    it('toggles password visibility', async () => {
        const user = userEvent.setup();
        render(<Login />);
        const password = screen.getByLabelText(/^Password/i);

        expect(password).toHaveAttribute('type', 'password');
        await user.click(password.parentElement.querySelector('button'));
        expect(password).toHaveAttribute('type', 'text');
    });

    it('fields are required', () => {
        render(<Login />);
        expect(screen.getByLabelText(/Employee ID/i)).toBeRequired();
        expect(screen.getByLabelText(/^Password/i)).toBeRequired();
    });
});
