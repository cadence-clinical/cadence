import {
  AppShellSidebar,
  Avatar,
  AvatarFallback,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@cadence-clinical/ui";
import {
  ChevronRight,
  ChevronsUpDown,
  Hospital,
  LayoutGrid,
  LogOut,
  Moon,
  Users,
  Workflow,
} from "lucide-react";

/** A list the sidebar offers, in the group it belongs to. */
export interface ListLink {
  id: string;
  label: string;
}

/** A collapsible set of lists, such as the team lists. */
export interface ListGroup {
  id: string;
  label: string;
  icon: "team" | "after-hours";
  lists: ListLink[];
}

/** Who the prototype is signed in as: a synthetic registrar. */
export const USER = { name: "Dr Tom Ellis", role: "Registrar · GMU A", initials: "TE" };

const ICONS = { team: Users, "after-hours": Moon };

/**
 * Option A's navigation, laid out like shadcn's sidebar-08: the app, the lists in collapsible
 * groups, links out of the prototype at the bottom, and who is signed in.
 */
export function AppSidebar({
  groups,
  current,
  hrefFor,
  onChoose,
}: {
  groups: ListGroup[];
  current: string;
  /** The address of a list, so each list is a link that can be opened, shared or bookmarked. */
  hrefFor: (listId: string) => string;
  onChoose: (listId: string) => void;
}) {
  return (
    <AppShellSidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#/patient-list/a" />}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Hospital aria-hidden className="size-4" />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">Clinical App</span>
                <span className="truncate text-control-sm text-muted-foreground">Prototype</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent aria-label="Lists">
        <SidebarGroup>
          <SidebarGroupLabel>Lists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {groups.map((group) => {
                const Icon = ICONS[group.icon];
                return (
                  <Collapsible
                    key={group.id}
                    defaultOpen
                    render={<SidebarMenuItem />}
                    className="group/collapsible"
                  >
                    <CollapsibleTrigger render={<SidebarMenuButton />}>
                      <Icon aria-hidden />
                      <span>{group.label}</span>
                      <ChevronRight
                        aria-hidden
                        className="ml-auto transition-transform group-data-open/collapsible:rotate-90"
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {group.lists.map((list) => (
                          <SidebarMenuSubItem key={list.id}>
                            <SidebarMenuSubButton
                              isActive={list.id === current}
                              href={hrefFor(list.id)}
                              onClick={() => {
                                onChoose(list.id);
                              }}
                            >
                              <span>{list.label}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" render={<a href="#/patient-list/flows" />}>
                  <Workflow aria-hidden />
                  <span>Flows</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm" render={<a href="#/" />}>
                  <LayoutGrid aria-hidden />
                  <span>All prototypes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="rounded-lg">
                  <AvatarFallback className="rounded-lg">{USER.initials}</AvatarFallback>
                </Avatar>
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{USER.name}</span>
                  <span className="truncate text-control-sm text-muted-foreground">
                    {USER.role}
                  </span>
                </span>
                <ChevronsUpDown aria-hidden className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{`${USER.name}, ${USER.role}`}</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut aria-hidden />
                  Sign out (does nothing in the prototype)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </AppShellSidebar>
  );
}
