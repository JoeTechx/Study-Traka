"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Course, CreateCourseInput } from "@/types/courses";

// GET API -- to get All courses
export async function getCourses(): Promise<Course[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }

  return data || [];
}

// POST API Course -- To create a course
export async function createCourse(
  input: CreateCourseInput,
): Promise<{ success: boolean; error?: string; data?: Course }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      title: input.title,
      code: input.code,
      unit: input.unit,
      lecturer_name: input.lecturer_name,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating course:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");

  return { success: true, data };
}

// PATCH API Course -- To Updata a course
export async function updateCourse(
  id: string,
  input: Partial<CreateCourseInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("courses")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating course:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");

  return { success: true };
}

// DELETE API Courses -- To Delete a Course
export async function deleteCourse(
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
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting course:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");

  return { success: true };
}
