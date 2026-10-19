import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@cadence-clinical/ui";
import {
  Ellipsis,
  PanelRightOpen,
  SquareArrowOutUpRight,
  UserCheck,
  UserMinus,
} from "lucide-react";

import type { Patient } from "../ward";
import { displayName } from "./patient-identity";
import type { ListActions } from "./views";

/**
 * A row's actions, behind one icon button at the end of the row, as the Data table's row-actions
 * pattern draws them: show the summary (the keyboard's and a screen reader's way to the pane, as a
 * click on the row is the pointer's), open the patient's screen, accept an incoming patient, mark
 * the patient seen, and remove them from the list, which asks first.
 *
 * The trigger carries `data-row-actions` with the patient's id, so focus can come back to it.
 */
export function RowActions({ patient, actions }: { patient: Patient; actions: ListActions }) {
  const name = displayName(patient);
  const isIncoming = actions.isIncoming(patient);
  const canMarkSeen = actions.list.kind !== "admitting" && !isIncoming;
  const canRemove = actions.list.kind !== "admitting" && !isIncoming;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-row-actions={patient.id}
        render={<Button variant="ghost" size="sm" iconOnly />}
      >
        <Ellipsis aria-hidden />
        {`Actions for ${name}`}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{name}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              actions.open(patient.id);
            }}
          >
            <PanelRightOpen aria-hidden />
            Show summary
          </DropdownMenuItem>
          <DropdownMenuItem render={<a href={actions.hrefFor(patient)} />}>
            <SquareArrowOutUpRight aria-hidden />
            Open patient
          </DropdownMenuItem>
          {isIncoming ? (
            <DropdownMenuItem
              onClick={() => {
                actions.accept(patient.id);
              }}
            >
              <UserCheck aria-hidden />
              {`Accept onto ${actions.list.label}`}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        {canMarkSeen ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              inset
              checked={actions.isSeen(patient)}
              onCheckedChange={(checked) => {
                actions.setSeen(patient.id, checked);
              }}
            >
              Seen today
            </DropdownMenuCheckboxItem>
          </>
        ) : null}
        {canRemove ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                actions.requestRemove(patient);
              }}
            >
              <UserMinus aria-hidden />
              Remove from list
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
