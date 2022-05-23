export const errorMessage = (field: string, message: string) => {
    return {
      errors: [
        {
          field,
          message,
        },
      ],
    };
}