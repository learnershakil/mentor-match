"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DataTable({
  data,
  columns,
  baseUrl,
  canEdit = true,
  canDelete = true,
  deleteHandler,
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleDelete = async (id) => {
    if (!deleteHandler) return;

    if (
      !confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setItemToDelete(id);

      const result = await deleteHandler(id);

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
            {(canEdit || canDelete) && (
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((column) => (
                <td
                  key={`${item.id}-${column.key}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
              {(canEdit || canDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canEdit && (
                    <Link
                      href={`${baseUrl}/${item.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </Link>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting && itemToDelete === item.id}
                    >
                      {isDeleting && itemToDelete === item.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
