"use client";

import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, Send } from "lucide-react";
import { useState, type FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { TextField } from "../text-field";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import { FormImageUploader } from "./image-uploader";
import { FormSection } from "./section";
import { MAX_FILE_SIZE, MAX_IMAGE_MEASUREMENT, MIN_IMAGE_MEASUREMENT, Photo } from "./utils";

const THIS_FIELD_IS_REQUIRED_MESSAGE = "To pole jest wymagane";

const LETTERS_REGEX = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;

const COUNTRIES = [
  { code: "PL", label: "Polska" },
  { code: "DE", label: "Niemcy" },
  { code: "US", label: "Stany Zjednoczone" },
] as const;

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

type CountryCode = (typeof COUNTRIES)[number]["code"];

const schema = z
  .object({
    firstName: z
      .string()
      .min(1, THIS_FIELD_IS_REQUIRED_MESSAGE)
      .trim()
      .min(2, "Imię musi mieć co najmniej 2 znaki")
      .max(40, "Imię nie może mieć więcej niż 40 znaków")
      .regex(LETTERS_REGEX, "Imię może zawierać tylko polskie i angielskie litery"),
    lastName: z
      .string()
      .min(1, THIS_FIELD_IS_REQUIRED_MESSAGE)
      .trim()
      .min(2, "Nazwisko musi mieć co najmniej 2 znaki")
      .max(40, "Nazwisko nie może mieć więcej niż 40 znaków")
      .regex(LETTERS_REGEX, "Nazwisko może zawierać tylko polskie i angielskie litery"),
    dateOfBirth: z
      .string()
      .min(1, THIS_FIELD_IS_REQUIRED_MESSAGE)
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi zostać zapisana w formacie: YYYY-MM-DD")
      .refine((date) => !isNaN(new Date(date).getTime()), "Data jest nieprawidłowa")
      .refine((date) => {
        const birthDate = new Date(date);
        const currentDate = new Date();

        const age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDifference = currentDate.getMonth() - birthDate.getMonth();

        // Check if the person has already turned 18 this year
        if (
          monthDifference < 0 ||
          (monthDifference === 0 && currentDate.getDate() < birthDate.getDate())
        ) {
          return age - 1 >= 18;
        }

        return age >= 18;
      }, "Musisz mieć co najmniej 18 lat"),
    addressLine1: z
      .string()
      .min(1, THIS_FIELD_IS_REQUIRED_MESSAGE)
      .trim()
      .min(5, "Adres musi mieć co najmniej 5 znaków")
      .max(60, "Adres nie może mieć więcej niż 60 znaków"),
    addressLine2: z.string().trim().max(60, "Adres nie może mieć więcej niż 60 znaków").optional(),
    zipCode: z
      .string()
      .min(1, THIS_FIELD_IS_REQUIRED_MESSAGE)
      .min(2, "Kod pocztowy musi mieć co najmniej 2 znaki")
      .max(10, "Kod pocztowy nie może mieć więcej niż 10 znaków")
      .regex(
        /^[a-zA-Z0-9\s-]+$/,
        "Kod pocztowy może zawierać tylko litery, cyfry, spacje i myślniki"
      ),
    voivodeship: z
      .string({ required_error: THIS_FIELD_IS_REQUIRED_MESSAGE }) //
      .min(1, THIS_FIELD_IS_REQUIRED_MESSAGE)
      .trim(),
    city: z.string().min(1, THIS_FIELD_IS_REQUIRED_MESSAGE).trim(),
    country: z.enum(COUNTRIES.map((country) => country.code) as [CountryCode, ...CountryCode[]], {
      errorMap: () => ({ message: THIS_FIELD_IS_REQUIRED_MESSAGE }),
    }),
  })
  .superRefine((data, ctx) => {
    if (data.country === "US") {
      if (!US_STATES.includes(data.voivodeship)) {
        ctx.addIssue({
          path: ["voivodeship"],
          code: z.ZodIssueCode.custom,
          message: "Wybierz stan z listy",
        });
      }
    } else {
      if (!LETTERS_REGEX.test(data.voivodeship)) {
        ctx.addIssue({
          path: ["voivodeship"],
          code: z.ZodIssueCode.custom,
          message: "Województwo lub region może zawierać tylko litery",
        });
      }
    }
  });

type Schema = z.infer<typeof schema>;

export const Form: FC = () => {
  const {
    register,
    watch,
    trigger,
    handleSubmit: handleReactHookFormSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<Schema>({ resolver: zodResolver(schema) });
  const [photos, setPhotos] = useState<{
    [key in "first" | "second"]: Photo;
  }>({
    first: { file: null, isValid: false, hasBeenUploaded: false, error: null },
    second: { file: null, isValid: false, hasBeenUploaded: false, error: null },
  });

  const selectedCountry = watch("country");
  const selectedVoivodeship = watch("voivodeship");

  const validateImage = (file: File): Promise<Photo> => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = MAX_FILE_SIZE * 1024 * 1024; // 2 MB

    if (!allowedTypes.includes(file.type)) {
      return Promise.resolve({
        isValid: false,
        file,
        hasBeenUploaded: true,
        error: "Tylko pliki JPG, PNG i WebP są dozwolone",
      });
    }

    if (file.size > maxSize) {
      return Promise.resolve({
        isValid: false,
        file,
        hasBeenUploaded: true,
        error: `Plik nie może być większy niż ${MAX_FILE_SIZE} MB`,
      });
    }

    return new Promise((resolve) => {
      const image = new Image();

      image.onload = () => {
        const { width, height } = image;

        if (width < MIN_IMAGE_MEASUREMENT[0] || height < MIN_IMAGE_MEASUREMENT[1]) {
          resolve({
            file,
            isValid: false,
            hasBeenUploaded: true,
            error: `Minimalne wymiary zdjęcia to ${MIN_IMAGE_MEASUREMENT.join("x")} px`,
          });
        }

        if (width > MAX_IMAGE_MEASUREMENT[0] || height > MAX_IMAGE_MEASUREMENT[1]) {
          resolve({
            file,
            isValid: false,
            hasBeenUploaded: true,
            error: `Maksymalne wymiary zdjęcia to ${MAX_IMAGE_MEASUREMENT.join("x")} px`,
          });
        }

        resolve({ isValid: true, hasBeenUploaded: true, error: "", file });
      };

      image.onerror = () => {
        resolve({
          file,
          isValid: false,
          hasBeenUploaded: true,
          error: "Nie można odczytać pliku obrazu",
        });
      };

      image.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (file: File | null, photoNumber: 1 | 2) => {
    if (!file) {
      switch (photoNumber) {
        case 1:
          setPhotos((previousState) => ({
            ...previousState,
            first: { file: null, isValid: false, hasBeenUploaded: false, error: null },
          }));

          break;

        case 2:
          setPhotos((previousState) => ({
            ...previousState,
            second: { file: null, isValid: false, hasBeenUploaded: false, error: null },
          }));

          break;
      }

      return;
    }

    const validation = await validateImage(file);
    const state = {
      file,
      isValid: validation.isValid,
      error: validation.error,
      hasBeenUploaded: true,
    };

    switch (photoNumber) {
      case 1:
        setPhotos((previousState) => ({ ...previousState, first: state }));

        break;
      case 2:
        setPhotos((previousState) => ({ ...previousState, second: state }));

        break;
    }
  };

  const handleFormSubmit = async () => {
    const isFormValid = await trigger();

    if (!photos.first.file) {
      setPhotos((previousState) => ({
        ...previousState,
        first: { ...previousState.first, error: THIS_FIELD_IS_REQUIRED_MESSAGE },
      }));
    }

    if (!photos.second.file) {
      setPhotos((previousState) => ({
        ...previousState,
        second: { ...previousState.second, error: THIS_FIELD_IS_REQUIRED_MESSAGE },
      }));
    }

    if (isFormValid && photos.first.isValid && photos.second.isValid) {
      handleReactHookFormSubmit(async (data: Schema) => {
        const submittedFormData = new FormData();

        // Dynamically appending filled form fields to FormData
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            submittedFormData.append(key, value);
          }
        });

        if (photos.first.file) {
          submittedFormData.append("firstPhoto", photos.first.file);
        }

        if (photos.second.file) {
          submittedFormData.append("secondPhoto", photos.second.file);
        }

        console.log("Dane formularza:", Object.fromEntries(submittedFormData));

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 500));

        toast.success("Formularz został pomyślnie wysłany!");
      })();
    }
  };

  const addressPlaceholders: Record<
    "country" | "voivodeship" | "city" | "zipCode" | "addressLine1" | "addressLine2",
    string
  > = {
    country: COUNTRIES[0].label,
    voivodeship:
      selectedCountry === "US"
        ? "California"
        : selectedCountry === "DE"
        ? "Nordrhein-Westfalen"
        : "Mazowieckie",
    city:
      selectedCountry === "US" ? "San Francisco" : selectedCountry === "DE" ? "Köln" : "Warszawa",
    zipCode: selectedCountry === "US" ? "94105" : selectedCountry === "DE" ? "50667" : "00-950",
    addressLine1:
      selectedCountry === "US"
        ? "1600 Market St"
        : selectedCountry === "DE"
        ? "Hohe Straße 52"
        : "ul. Marszałkowska 100",
    addressLine2:
      selectedCountry === "US" ? "Suite 200" : selectedCountry === "DE" ? "2. Etage" : "lok. 5",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Formularz rekrutacyjny</CardTitle>
            <CardDescription className="text-gray-600">
              Żeby aplikować na to stanowisko, prosimy o wypełnienie poniższego formularza.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <FormSection name="Dane osobowe">
              <TextField
                required
                label="Imię"
                htmlFor="firstName"
                error={errors.firstName?.message}
                input={
                  <Input
                    {...register("firstName")}
                    id="firstName"
                    placeholder="Jan"
                    className={cn(errors.firstName ? "border-red-500" : null)}
                  />
                }
              />

              <TextField
                required
                label="Nazwisko"
                htmlFor="lastName"
                error={errors.lastName?.message}
                input={
                  <Input
                    {...register("lastName")}
                    id="lastName"
                    placeholder="Kowalski"
                    className={cn(errors.lastName ? "border-red-500" : null)}
                  />
                }
              />

              <TextField
                required
                label="Data urodzenia"
                htmlFor="dateOfBirth"
                error={errors.dateOfBirth?.message}
                input={
                  <Input
                    {...register("dateOfBirth")}
                    id="dateOfBirth"
                    placeholder="2006-12-25"
                    className={cn(errors.dateOfBirth ? "border-red-500" : null)}
                  />
                }
              />
            </FormSection>

            <FormSection name="Adres">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Kraj"
                  htmlFor="country"
                  error={errors.country?.message}
                  input={
                    <Select
                      onValueChange={(value) => {
                        setValue("country", value as Schema["country"]);
                        setValue("voivodeship", ""); // Reset voivodeship when country changes
                      }}
                    >
                      <SelectTrigger
                        id="country"
                        className={cn("w-full", errors.city ? "border-red-500" : null)}
                      >
                        <SelectValue placeholder={addressPlaceholders.country} />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />

                <TextField
                  required
                  label="Region/Województwo"
                  error={errors.voivodeship?.message}
                  htmlFor="voivodeship"
                  input={
                    selectedCountry === "US" ? (
                      <Select onValueChange={(value) => setValue("voivodeship", value)}>
                        <SelectTrigger
                          className={cn("w-full", errors.voivodeship ? "border-red-500" : null)}
                        >
                          <SelectValue placeholder={addressPlaceholders.voivodeship} />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        name="voivodeship"
                        id="voivodeship"
                        value={
                          selectedVoivodeship && !US_STATES.includes(selectedVoivodeship)
                            ? selectedVoivodeship
                            : ""
                        }
                        onChange={(event) =>
                          setValue(
                            "voivodeship",
                            US_STATES.includes(selectedVoivodeship) ? "" : event.target.value
                          )
                        }
                        className={cn(errors.voivodeship ? "border-red-500" : null)}
                        placeholder={addressPlaceholders.voivodeship}
                        disabled={!selectedCountry}
                      />
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  required
                  label="Miasto"
                  htmlFor="city"
                  error={errors.city?.message}
                  input={
                    <Input
                      {...register("city")}
                      id="city"
                      placeholder={addressPlaceholders.city}
                      className={cn(errors.city ? "border-red-500" : null)}
                    />
                  }
                />

                <TextField
                  required
                  label="Kod pocztowy"
                  htmlFor="zipCode"
                  error={errors.zipCode?.message}
                  input={
                    <Input
                      {...register("zipCode")}
                      id="zipCode"
                      placeholder={addressPlaceholders.zipCode}
                      className={cn(errors.zipCode ? "border-red-500" : null)}
                    />
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  required
                  label="Adres 1"
                  htmlFor="addressLine1"
                  error={errors.addressLine1?.message}
                  input={
                    <Input
                      {...register("addressLine1")}
                      id="addressLine1"
                      placeholder={addressPlaceholders.addressLine1}
                      className={cn(errors.addressLine1 ? "border-red-500" : null)}
                    />
                  }
                />

                <TextField
                  label="Adres 2"
                  htmlFor="addressLine2"
                  error={errors.addressLine2?.message}
                  input={
                    <Input
                      {...register("addressLine2")}
                      id="addressLine2"
                      placeholder={addressPlaceholders.addressLine2}
                      className={cn(errors.addressLine2 ? "border-red-500" : null)}
                    />
                  }
                />
              </div>
            </FormSection>

            <FormSection name="Zdjęcie">
              <FormImageUploader
                image={photos.first}
                textField={{
                  required: true,
                  label: "Zdjęcie nr 1",
                  htmlFor: "firstPhoto",
                  error: photos.first.error,
                  onChange: (event) => handleFileChange(event.target.files?.[0] || null, 1),
                }}
              />
              <FormImageUploader
                image={photos.second}
                textField={{
                  required: true,
                  label: "Zdjęcie nr 2",
                  htmlFor: "secondPhoto",
                  error: photos.second.error,
                  onChange: (event) => handleFileChange(event.target.files?.[0] || null, 2),
                }}
              />
            </FormSection>
            <Separator />

            <Button
              type="button"
              className="w-full"
              onClick={handleFormSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2Icon className="animate-spin" /> : <Send />}
              Wyślij formularz
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
