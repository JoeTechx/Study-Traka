"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReadingListItem, CreateReadingListInput } from "@/types/courses";

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


// PATCH API
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
