/**
 * TEST MODE CONFIGURATION
 * Set TEST_MODE = true to bypass all Supabase calls
 * This is for testing purposes only - remove before production
 */

export const TEST_MODE = true;

// Mock user data for test mode
export const MOCK_USER = {
  id: 'test-user-123',
  email: 'tester@cosvys.com',
  full_name: 'Test User',
};

// Mock dealer info for test mode
export const MOCK_DEALER_INFO = {
  shopName: 'Test Paint Shop',
  dealerName: 'Test Dealer',
  phone: '9876543210',
  location: 'Test Location',
};

// Mock projects for test mode
export const MOCK_PROJECTS = [
  {
    id: 'test-project-1',
    lead_id: 'LEAD001',
    customer_name: 'John Doe',
    phone: '9876543210',
    location: 'Mumbai',
    project_type: 'Interior',
    project_status: 'In Progress',
    quotation_value: 125000,
    area_sqft: 1200,
    project_date: new Date().toISOString(),
    approval_status: 'Pending',
    reminder_sent: false,
    notification_count: 2,
    created_at: new Date().toISOString(),
    start_date: null,
    end_date: null,
  },
  {
    id: 'test-project-2',
    lead_id: 'LEAD002',
    customer_name: 'Jane Smith',
    phone: '8765432109',
    location: 'Delhi',
    project_type: 'Exterior',
    project_status: 'Quoted',
    quotation_value: 250000,
    area_sqft: 2500,
    project_date: new Date().toISOString(),
    approval_status: 'Approved',
    reminder_sent: true,
    notification_count: 0,
    created_at: new Date().toISOString(),
    start_date: '2025-01-01',
    end_date: '2025-01-15',
  },
];

// Mock rooms for test mode
export const MOCK_ROOMS = [
  {
    id: 'test-room-1',
    project_id: 'test-project-1',
    room_name: 'Living Room',
    room_type: 'Living Room',
    length: 15,
    width: 12,
    height: 10,
    paint_type: 'Premium',
    ceiling_paint: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'test-room-2',
    project_id: 'test-project-1',
    room_name: 'Bedroom 1',
    room_type: 'Bedroom',
    length: 12,
    width: 10,
    height: 10,
    paint_type: 'Standard',
    ceiling_paint: true,
    created_at: new Date().toISOString(),
  },
];

// Mock lead stats
export const MOCK_LEAD_STATS = {
  total: 15,
  converted: 8,
  dropped: 3,
  pending: 4,
};
