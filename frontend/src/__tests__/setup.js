import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: 'test-group-id' }),
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    NavLink: ({ children, to, className }) => (
      <a href={to} className={typeof className === 'function' ? className({ isActive: false }) : className}>
        {children}
      </a>
    ),
  };
});

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div />,
}));

// Mock API client
vi.mock('../api/client', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  groupsApi: {
    list: vi.fn().mockResolvedValue({ data: [] }),
    get: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getBalances: vi.fn().mockResolvedValue({ data: [] }),
    getSettlementPlan: vi.fn().mockResolvedValue({ data: [] }),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
  expensesApi: {
    list: vi.fn().mockResolvedValue({ data: { expenses: [], total: 0 } }),
    create: vi.fn(),
    delete: vi.fn(),
  },
  settlementsApi: {
    create: vi.fn(),
    list: vi.fn().mockResolvedValue({ data: [] }),
  },
  default: {},
}));

// Suppress console.error in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
