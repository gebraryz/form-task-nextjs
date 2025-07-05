import type { FC, PropsWithChildren } from "react";
import { Separator } from "../ui/separator";

interface Props extends PropsWithChildren {
  name: string;
}

export const FormSection: FC<Props> = ({ name, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
    <Separator className="my-3" />
    <div className="space-y-4">{children}</div>
  </div>
);
