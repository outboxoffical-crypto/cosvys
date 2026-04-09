# About Site Survey (ASS) - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### What's New?
A new **About Site Survey** screen has been added to your Cosvys app. It appears after project creation and before room measurements, collecting important site condition information.

### Files Added
1. ✅ `src/components/AboutSiteSurveyScreen.tsx` - Main component
2. ✅ `supabase/migrations/20250309000000_create_site_surveys_table.sql` - Database table
3. ✅ `src/App.tsx` - Updated with new route and import
4. ✅ `src/components/AddProjectScreen.tsx` - Updated navigation

### Navigation Changes
```
Before: Add Project → Room Measurement
After:  Add Project → About Site Survey → Room Measurement
```

## 📋 Setup Instructions

### 1. Apply Database Migration
```bash
# Open Supabase dashboard and run the migration:
# Or use Supabase CLI:
supabase db push
```

The migration creates:
- `site_surveys` table
- RLS (Row Level Security) policies
- Indexes for performance
- Automatic timestamps

### 2. Verify Installation
Check that these changes are in place:

✅ **App.tsx** has:
```typescript
import AboutSiteSurveyScreen from "./components/AboutSiteSurveyScreen";
<Route path="/site-survey/:projectId" element={<AboutSiteSurveyScreen />} />
```

✅ **AddProjectScreen.tsx** navigates to:
```typescript
navigate(`/site-survey/${newProject.id}`);
```

### 3. Test It!
1. Click "Add Project"
2. Fill in customer details
3. Click "Continue to Measurements"
4. **You should now see the About Site Survey form**
5. Fill in all survey fields
6. Click "Save & Continue to Room Measurements"
7. Verify you're redirected to room measurement

## 📝 Survey Questions

The form collects 8 required fields:

| Field | Options |
|-------|---------|
| **Work Type** | Fresh Painting, Repainting, Partial Repair |
| **Surface Condition** | Smooth, Medium, Rough, Damaged |
| **Existing Paint** | Good, Slightly Peeling, Heavy Peeling, Damp |
| **Preparation** | Basic Cleaning, Scraping, Putty, Crack Filling |
| **Dampness** | No, Minor, Moderate, Severe |
| **Wall Height** | Below 10ft, 10-15ft, Above 15ft |
| **Accessibility** | Easy, Moderate, Difficult |
| **Notes** | Optional text field |

## 🎨 UI Components Used

All from your existing shadcn/ui library:
- `Button` - Submit button
- `Card` - Form container
- `Label` - Field labels
- `RadioGroup` - Option selection
- `Textarea` - Notes field

No new dependencies required!

## 💾 Data Structure

Saved data structure in Supabase:
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "work_type": "fresh|repaint|partial",
  "surface_condition": "smooth|medium|rough|damaged",
  "existing_paint": "good|slightly_peeling|heavy_peeling|damp",
  "preparation": "basic_cleaning|scraping|putty|crack_filling",
  "dampness": "none|minor|moderate|severe",
  "wall_height": "normal|medium|high",
  "accessibility": "easy|moderate|difficult",
  "notes": "optional text",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## ✨ Features

✅ **Form Validation** - All required fields must be filled
✅ **Loading States** - Shows spinner while loading data
✅ **Error Handling** - User-friendly error messages
✅ **Edit Support** - Re-edit surveys for existing projects
✅ **Authentication** - Secure user isolation via RLS
✅ **Auto-save** - Uses upsert for create/update
✅ **Responsive** - Works on mobile and desktop
✅ **Styled** - Matches your app's design system

## 🔍 How It Works

### On Load
1. Check user is authenticated
2. Fetch existing survey data if any
3. Display form with loaded data (or empty)

### On Submit
1. Validate all required fields
2. Save to Supabase `site_surveys` table
3. Navigate to room measurements
4. Show success toast notification

### Database
- One survey per project (UNIQUE constraint)
- All fields validated with CHECK constraints
- User data isolated with RLS policies
- Automatic timestamp management

## 🐛 Troubleshooting

### Screen not appearing?
- Check migration was applied: `supabase db push`
- Verify route in App.tsx exists
- Check browser console for errors

### Data not saving?
- Verify Supabase connection
- Check internet connection
- Review browser DevTools Network tab
- Check Supabase logs

### Can't edit existing survey?
- Navigation back to survey should auto-load data
- Try refreshing the page
- Check that project_id matches

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `AboutSiteSurveyScreen.tsx` | Main form component (335 lines) |
| `20250309000000_create_site_surveys_table.sql` | Database migration |
| `ABOUT_SITE_SURVEY_IMPLEMENTATION.md` | Detailed documentation |
| `QUICK_START.md` | This file |

## 🎯 Next Steps

1. ✅ Apply the database migration
2. ✅ Test creating a new project
3. ✅ Fill the survey form
4. ✅ Verify data appears in Supabase
5. ✅ Test editing existing surveys
6. ✅ Continue with room measurements

## 💡 Tips

- Use the optional notes field to capture additional observations
- All survey data is saved and can be edited later
- The form validates before submission to prevent errors
- Loading indicators show when data is being fetched/saved
- Navigation back to dashboard uses the arrow button

## 🔒 Security

- Row Level Security (RLS) ensures users only access their own data
- Authentication required to view/edit surveys
- Foreign key constraint maintains data integrity
- All inputs validated both client and server-side

---

**Status:** ✅ Ready to Use
**Version:** 1.0
**Last Updated:** March 11, 2026

Need help? See `ABOUT_SITE_SURVEY_IMPLEMENTATION.md` for detailed documentation.
