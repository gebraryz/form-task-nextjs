import { cn } from "@/lib/utils";
import { BadgeX, CheckCircle, Upload } from "lucide-react";
import type { ChangeEventHandler, FC } from "react";
import { TextField, TextFieldProps } from "../text-field";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { MAX_FILE_SIZE, Photo } from "./utils";

export const FormImageUploader: FC<{
  image: Photo;
  textField: Omit<TextFieldProps, "input" | "onChange"> & {
    onChange?: ChangeEventHandler<HTMLInputElement>;
  };
}> = ({ textField, image }) => (
  <TextField
    label={textField.label}
    htmlFor={textField.htmlFor}
    error={image.error}
    required={textField.required}
    input={
      <div className="relative">
        <Input
          id={textField.htmlFor}
          name={textField.htmlFor}
          onChange={textField.onChange}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        <Label
          htmlFor={textField.htmlFor}
          className={cn(
            "mt-2 flex items-center shadow-xs flex-col justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer transition-colors",
            !image.isValid && image.error
              ? "border-red-500 hover:border-red-600"
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          {!image.isValid && image.error ? (
            <BadgeX className="mx-auto h-8 w-8 text-red-500 mb-2" />
          ) : image.isValid ? (
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
          ) : (
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          )}
          <p className="text-xs text-center text-gray-500">
            Akceptowane formaty: <code>.jpg</code>, <code>.png</code>, <code>.webp</code>
            <br />
            Akceptowane rozmiary: 512-1024 px
            <br />
            Maksymalny rozmiar pliku: {MAX_FILE_SIZE} MB
          </p>
        </Label>
      </div>
    }
  />
);
