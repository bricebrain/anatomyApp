import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProject, listProjects } from '../../projects/projectRepository';
import type { DrawingProject } from '../../projects/types';

const PROJECTS_QUERY_KEY = ['drawing-projects'] as const;

export function useHomeProjects() {
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: listProjects,
  });
  const deleteMutation = useMutation({
    mutationFn: (project: DrawingProject) => deleteProject(project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });

  return {
    projects: projectsQuery.data ?? [],
    loading: projectsQuery.isLoading,
    removeProject: deleteMutation.mutateAsync,
  };
}
