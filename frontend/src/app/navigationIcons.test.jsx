import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { navigationGroups, activeNavigation } from './navigationConfig.js';
import { navigationIcons, resolveNavigationIcon } from './navigationIcons.js';
import Sidebar from '../components/Sidebar.jsx';
vi.mock('react-redux',()=>({useDispatch:()=>vi.fn(),useSelector:selector=>selector({platform:{sidebarCollapsed:false}})}));
vi.mock('../auth/AuthProvider.jsx',()=>({useAuth:()=>({user:{displayName:'Compte de recette',permissions:['*']},logout:vi.fn()})}));
vi.mock('../contexts/TenantProvider.jsx',()=>({useTenant:()=>({activeTenant:{id:'tenant-a'},loading:false,error:null})}));
describe('Sidebar icon registry and navigation',()=>{
  it('resolves every configured icon and renders unknown names safely',()=>{
    for(const group of navigationGroups) expect(navigationIcons[group.icon]).toBeDefined();
    const Fallback=resolveNavigationIcon('unknown'); render(<Fallback data-testid="fallback"/>);
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
  it('maps application details to the Applications UX parent',()=>{
    expect(activeNavigation('/business-manager/applications/example').id).toBe('bmApplications');
    expect(activeNavigation('/business-manager/applications/example/versions/version').id).toBe('bmApplications');
  });
  it('renders five sections, the authenticated user and a working menu search',()=>{
    render(<MemoryRouter initialEntries={['/business-manager']}><Sidebar isOpen={false} onClose={()=>{}}/></MemoryRouter>);
    expect(screen.getAllByRole('heading',{level:2})).toHaveLength(5);
    expect(screen.getByText('Compte de recette')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Vue d’ensemble'})).toHaveAttribute('aria-current','page');
    fireEvent.change(screen.getByLabelText('Rechercher dans le menu'),{target:{value:'Navigation'}});
    expect(screen.getAllByRole('link',{name:'Navigation',exact:true}).map(link => link.getAttribute('href'))).toEqual(expect.arrayContaining(['/business-manager/navigation', '/ui/navigation']));
    // Le groupe UI Builder est maintenant implémenté : il reste visible lors de
    // la recherche tant qu'une de ses pages correspond (ici « Navigation »).
    expect(screen.queryByRole('button',{name:'UI Builder'})).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Rechercher dans le menu'),{target:{value:'zzzz-inexistant'}});
    expect(screen.queryByRole('button',{name:'UI Builder'})).not.toBeInTheDocument();
  });
});
