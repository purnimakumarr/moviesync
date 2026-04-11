import { FocusEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { useTranslation } from 'react-i18next';

import { Button, TextField, Stack, Tooltip, useTheme, Box, Autocomplete } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en-in';

import { updateUser } from '../../redux/features/userSlice';

import { Formik, Field, Form, ErrorMessage, FormikHandlers } from 'formik';
import * as Yup from 'yup';
import { parsePhoneNumberFromString, AsYouType, getCountryCallingCode, CountryCode } from 'libphonenumber-js/mobile';
import { generateCountryList } from '../../utils/phoneUtils';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider/LocalizationProvider';

// List of countries for the dropdown
const countries = generateCountryList();

type ProfileValues = {
    firstName: string,
    middleName: string,
    lastName: string,
    birthDate: Dayjs | null,
    phoneCountry: string,
    phoneNumber: string,
    email: string,
}

type EditProfileFormProps = {
    onEditProfileClose: () => void;
}

function EditProfile({ onEditProfileClose }: EditProfileFormProps) {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const theme = useTheme();

    const { firstName, middleName, lastName, phone, dob, userID } = useSelector((store: RootState) => store.user);

    // Parse the phone number to extract country and national number
    const parseInitialPhone = () => {
        if (!phone) return { country: 'IN', number: '' };

        try {
            const phoneNumber = parsePhoneNumberFromString(phone);
            if (phoneNumber) {
                return {
                    country: phoneNumber.country || 'IN',
                    number: new AsYouType(phoneNumber.country as CountryCode).input(phoneNumber.nationalNumber || '')
                };
            }
        } catch (error) {
            console.error('Error parsing phone number:', error);
        }

        return { country: 'IN', number: phone };
    };

    const initialPhoneData = parseInitialPhone();

    const initialProfileValues: ProfileValues = {
        firstName: firstName || '',
        middleName: middleName || '',
        lastName: lastName || '',
        birthDate: dayjs(dob).locale(`en-${initialPhoneData.country}`),
        phoneCountry: initialPhoneData.country,
        phoneNumber: initialPhoneData.number,
        email: userID || '',
    };

    const profileValidationSchema = Yup.object().shape({
        firstName: Yup.string()
            .matches(/^\S+$/, t("profile.error_first_name_one_word"))
            .required(t('profile.error_first_name_required')),
        middleName: Yup.string(),
        lastName: Yup.string()
            .matches(/^\S+$/, t("profile.error_last_name_one_word"))
            .required(t("profile.error_last_name_required")),
        // birthDate: Yup.date().nullable().typeError(t('profile.error_invalid_date_format'))
        //     .test(
        //         'is-16-or-older',
        //         t('profile.error_age_older_than_sixteen'),
        //         (value) => {
        //             if (!value) return false;
        //             const birthDate = new Date(value);
        //             console.log(birthDate);
        //             if (isNaN(birthDate.getTime())) return false;

        //             const today = new Date();
        //             const minDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

        //             return birthDate <= minDate;
        //         }
        //     ),
        // birthDate: Yup.mixed<Dayjs>()
        //     .nullable()
        //     .test('is-valid', t('profile.error_invalid_date_format'), value => value == null || value.isValid?.())
        //     .test('is-16-or-older', t('profile.error_age_older_than_sixteen'), value => {
        //         if (!value || !value.isValid()) return false;
        //         const today = dayjs();
        //         const minDate = today.subtract(16, 'year');
        //         return value.isBefore(minDate, 'day');
        //     }),
        birthDate: Yup.mixed<Dayjs>()
            .nullable()
            .typeError(t('profile.error_invalid_date_format'))
            .test('is-16-or-older', t('profile.error_age_older_than_sixteen'), (value) => {
                if (!value || !value.isValid()) return false;
                const today = dayjs();
                const sixteenYearsAgo = today.subtract(16, 'years');
                return value.isBefore(sixteenYearsAgo, 'day');
            }),
        phoneCountry: Yup.string().required(t('profile.error_country_required')),
        phoneNumber: Yup.string()
            .test('is-valid-phone', t('profile.error_invalid_phone_number'), function (value) {
                const { phoneCountry } = this.parent;

                if (!value && !phoneCountry) return true;

                if (!value || !phoneCountry) return false;

                try {
                    const phoneNumber = parsePhoneNumberFromString(value, phoneCountry);
                    return phoneNumber ? phoneNumber.isValid() : false;
                } catch (error) {
                    console.log('Error validating phone number:', error)
                    return false;
                }
            }).required(t('profile.error_phone_number_required')),
    });


    const handleBlurPhoneNumber = function (
        e: FocusEvent<HTMLTextAreaElement | HTMLInputElement | HTMLDivElement>,
        handleBlur: FormikHandlers['handleBlur'],
        values: ProfileValues,
        setFieldValue: (field: string, value: string, shouldValidate?: boolean) => void
    ) {
        handleBlur(e);

        // Format the phone number when the field loses focus
        if (values.phoneNumber && values.phoneCountry) {
            try {
                const formatter = new AsYouType(values.phoneCountry as CountryCode);
                const formattedNumber = formatter.input(values.phoneNumber);

                if (formattedNumber) {
                    setFieldValue('phoneNumber', formattedNumber);
                }
            } catch (error) {
                console.error('Error formatting phone number:', error);
            }
        }
    }

    const handleEditProfileSubmit = function (values: ProfileValues) {
        onEditProfileClose();

        // Format the phone number with country code for storage
        const fullPhoneNumber = `+${getCountryCallingCode(values.phoneCountry as CountryCode)}${values.phoneNumber}`;

        dispatch(updateUser({
            userID: values.email,
            firstName: values.firstName,
            middleName: values.middleName,
            lastName: values.lastName,
            phone: fullPhoneNumber,
            dob: values.birthDate?.format('YYYY-MM-DD') || '',
            country: values.phoneCountry
        }));
    }

    return (<>
        <Formik
            initialValues={initialProfileValues}
            validationSchema={profileValidationSchema}
            onSubmit={handleEditProfileSubmit}
            enableReinitialize
        >
            {({ errors, touched, values, handleChange, handleBlur, dirty, setFieldValue }) => (
                <Form>
                    <Grid container columns={12} spacing={2} sx={{ mb: '3rem' }}>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Field
                                value={values.firstName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                as={TextField}
                                fullWidth
                                label={t('profile.first_name')}
                                name="firstName"
                                error={touched.firstName && !!errors.firstName}
                                helperText={<ErrorMessage name="firstName" />}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Field
                                value={values.middleName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                as={TextField}
                                fullWidth
                                label={t('profile.middle_name')}
                                name="middleName"
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                            <Field
                                value={values.lastName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                as={TextField}
                                fullWidth
                                label={t('profile.last_name')}
                                name="lastName"
                                error={touched.lastName && !!errors.lastName}
                                helperText={<ErrorMessage name="lastName" />}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={`${values.phoneCountry ? `en-${values.phoneCountry.toLowerCase()}` : 'en-in'}`}>
                                <DatePicker
                                    value={values.birthDate}
                                    // onChange={handleChange}
                                    onChange={(value) => {
                                        setFieldValue('birthDate', value);
                                    }}
                                    // onBlur={handleBlur}
                                    label={t('profile.birth_date')}
                                    name="birthDate"
                                    sx={{ mb: 2 }}
                                    // error={touched.birthDate && !!errors.birthDate}
                                    // helperText={<ErrorMessage name="birthDate" />}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            error: touched.birthDate && Boolean(errors.birthDate),
                                            helperText: touched.birthDate && typeof errors.birthDate === 'string' ? errors.birthDate : '',
                                        },
                                    }}
                                    disableFuture
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 8 }}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                {/* Country code selector */}
                                <Autocomplete
                                    options={countries}
                                    getOptionLabel={(option) =>
                                        `${option.flag} ${option.name} (+${getCountryCallingCode(option.code)})`
                                    }
                                    value={countries.find((c) => c.code === values.phoneCountry) || null}
                                    onChange={(_event, newValue) => {
                                        const selectedCode = newValue?.code || '';

                                        // Fallback to default locale if no country is selected
                                        const fallbackLocale = 'en-in';
                                        const newLocale = selectedCode ? `en-${selectedCode.toLowerCase()}` : fallbackLocale;

                                        dayjs.locale(newLocale); // Update locale globally
                                        setFieldValue('phoneCountry', selectedCode);
                                    }}
                                    onBlur={(e) => {
                                        handleBlurPhoneNumber(e, handleBlur, values, setFieldValue);
                                    }}
                                    isOptionEqualToValue={(option, value) => option.code === value.code}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={t('profile.country')}
                                            error={touched.phoneCountry && !!errors.phoneCountry}
                                            helperText={touched.phoneCountry && errors.phoneCountry}
                                        />
                                    )}
                                    sx={{ minWidth: '16rem' }}
                                    slotProps={{
                                        listbox: {
                                            style: {
                                                maxHeight: 220,
                                                overflowY: 'auto',
                                            },
                                        }
                                    }}
                                />

                                {/* Phone number input */}
                                <TextField
                                    fullWidth
                                    label={t('profile.phone_number')}
                                    name="phoneNumber"
                                    value={values.phoneNumber}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        handleBlurPhoneNumber(e, handleBlur, values, setFieldValue);
                                    }}
                                    error={touched.phoneNumber && !!errors.phoneNumber}
                                    helperText={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : ''}
                                />
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Tooltip title={t('profile.email_cannot_be_changed')}>
                                <Field
                                    value={values.email}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    as={TextField}
                                    fullWidth
                                    label={t('profile.email')}
                                    name="email"
                                    disabled
                                    sx={{
                                        mb: 2,
                                        '& .Mui-disabled': {
                                            color: theme.palette.text.primary,
                                            cursor: 'not-allowed',
                                            pointerEvents: 'auto',
                                            borderRadius: '12px'
                                        },
                                        "& .MuiInputBase-input.Mui-disabled": {
                                            WebkitTextFillColor: theme.palette.text.primary,
                                            color: theme.palette.text.primary,
                                            bgcolor: theme.palette.background.primary,
                                            opacity: 1,
                                        },
                                        "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-input": {
                                            color: theme.palette.text.primary,
                                        },
                                        "& .MuiInputBase-root.Mui-disabled .MuiInputBase-input": {
                                            color: theme.palette.text.primary,
                                        }
                                    }}
                                />
                            </Tooltip>
                        </Grid>
                    </Grid>
                    <Stack direction='row' sx={{ justifyContent: 'flex-end' }}>
                        <Button sx={{
                            fontSize: { sm: "0.8rem", lg: '1rem' },
                            padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                            minWidth: { xs: "80px", sm: "100px", md: "120px", lg: "150px" },
                            fontWeight: 600
                        }} onClick={onEditProfileClose} size='large' color="primary">
                            {t('profile.cancel')}
                        </Button>
                        <Button disabled={!dirty} type="submit" size='large' variant="contained" sx={{
                            width: 'fit-content', '&:disabled': {
                                bgcolor: theme.palette.background.primary,
                                color: theme.palette.text.primary,
                                cursor: 'not-allowed',
                                pointerEvents: 'auto',
                                fontSize: { sm: "0.8rem", lg: '1rem' },
                                padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                                minWidth: { xs: "80px", sm: "100px", md: "120px", lg: "150px" },
                                fontWeight: 600

                            }
                        }}>
                            {t('profile.update')}
                        </Button>
                    </Stack>
                </Form>
            )}
        </Formik >
    </>)
}

export default EditProfile;