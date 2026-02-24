"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ReadingListItem,
  CreateReadingListInput,
  BorderColor,
} from "@/types/courses";

// Available border colors
const borderColors: BorderColor[] = [
  "gray",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];

// Function to get random border color
function getRandomBorderColor(): BorderColor {
  const randomIndex = Math.floor(Math.random() * borderColors.length);
  return borderColors[randomIndex];
}

// GET API
export async function getReadingList(): Promise<ReadingListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("reading_list")
    .select(
      `
      *,
      course:courses(*)
    `,
    )
    .eq("user_id", user.id)
    .order("class_date", { ascending: true });

  if (error) {
    console.error("Error fetching reading list:", error);
    return [];
  }

  return data || [];
}

// POST API
export async function createReadingListItem(
  input: CreateReadingListInput,
): Promise<{ success: boolean; error?: string; data?: ReadingListItem }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("reading_list")
    .insert({
      user_id: user.id,
      course_id: input.course_id,
      topic: input.topic,
      class_date: input.class_date,
      starred: false,
      border_color: getRandomBorderColor(), // Random color on creation
    })
    .select(
      `
      *,
      course:courses(*)
    `,
    )
    .single();

  if (error) {
    console.error("Error creating reading list item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");

  return { success: true, data };
}

// PATCH API - Toggle Done
export async function toggleReadingListItem(
  id: string,
  done: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("reading_list")
    .update({ done })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error toggling reading list item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");

  return { success: true };
}

// PATCH API - Toggle Starred
export async function toggleStarredItem(
  id: string,
  starred: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("reading_list")
    .update({ starred })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error toggling starred item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");

  return { success: true };
}

// PATCH API - Update Border Color
export async function updateBorderColor(
  id: string,
  borderColor: BorderColor,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("reading_list")
    .update({ border_color: borderColor })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating border color:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");

  return { success: true };
}

// DELETE API
export async function deleteReadingListItem(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("reading_list")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting reading list item:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/courses");

  return { success: true };
}
