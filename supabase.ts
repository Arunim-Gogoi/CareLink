import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ijzylnmrsgkomjlxzjgx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlqenlsbm1yc2drb21qbHh6amd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzM0OTYsImV4cCI6MjA5NzAwOTQ5Nn0.Shu-SASuMd0PBZkAasDaPk224nU5c9L5vDCo51lKZG0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);