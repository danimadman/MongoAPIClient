var baseUrl = '';
/*var token = {
    "accessToken": "",
    "refreshToken": "",
    "expiresIn": 0,
    "login": "",
    "expiresDateTime": {}
};*/
var MongoApi = {
    init: function (url) {
        baseUrl = url;
    },
    getToken: async function () {
        token = Cookies.getJSON("UnivuzApiToken");
        if (token !== undefined && !isNaN(Date.parse(token.expiresDateTime)) && Date.parse(token.expiresDateTime) > Date.now()) {
            return;
        }
        token = token === undefined ? await this.getApiToken() : await this.refreshToken();
    },
    getApiToken: async function () {
        let code = Cookies.get("UnivuzApiCode");
        let login = Cookies.get("UnivuzApiLogin");
        if (code !== undefined) {
            try {
                let result = await this.apiCallback('POST', 'auth/GetTokenByCode', {
                    Login: login,
                    Code: code
                });
                if (result.accessToken !== undefined) {
                    Cookies.set("UnivuzApiToken", result, { path: '/' });
                    token = result;
                }
                return result;
            } catch (error) {
                console.log('Error:', error);
            }
        }
    },
    tryGetToken: async function () {
        if (token === undefined || isNaN(Date.parse(token.expiresDateTime)) || Date.parse(token.expiresDateTime) <= Date.now()) {
            for (var i = 0; i < 5; i++) {
                await UnivuzApi.getToken();
                if (token !== undefined && !isNaN(Date.parse(token.expiresDateTime)) && Date.parse(token.expiresDateTime) > Date.now())
                    break;
            }
            if (token === undefined || Date.parse(token.expiresDateTime) <= Date.now()) {
                showApiNotification("Учетные данные не подтверждены", "Ошибка авторизации", "error");
                return false;
            }
        }

        return true;
    },
    refreshToken: async function () {
        try {
            let result = await this.apiCallback('POST', 'auth/RefreshToken', { RefreshToken: token.refreshToken });
            if (result.accessToken !== undefined) {
                Cookies.set("UnivuzApiToken", result, { path: '/' });
                token = result;
            }
            return result;
        }
        catch (error) {
            await this.getApiToken();
            console.log('Error:', error);
        }
    },
    getHotelRooms: async function () {
        try {
            return await this.apiCallback('GET', `Hotel/Get`, null, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getDictComfortLevel: async function () {
        try {
            return await this.apiCallback('GET', `Dict/GetDictComfortLevel`, null, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    deleteHotelRoom: async function (id) {
        try {
            return await this.apiCallback('DELETE', `Hotel/Delete/${id}`, null, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    postHotelRoom: async function(data) {
        try {
            return await this.apiCallback('POST', `Hotel/Post`, data, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    putHotelRoom: async function(data) {
        try {
            return await this.apiCallback('PUT', `Hotel/Update`, data, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },




    getFacultyList: async function () {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetFacultyList`, null, 0);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getAltSubjectsTree: async function (studyYear, facultyId) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetAltSubjectsTree/${dictStudyLevelId}/${dictQualificationId}/${studyYear}/${facultyId}`, null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getAltSubjectInfo: async function (bupId, numSemestr, subjectId, altSubjectId) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetAltSubjectInfo/${studyYear}/${bupId}/${numSemestr}/${subjectId}/${altSubjectId}`,
                null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getSignedUpStudents: async function (bupId, numSemestr, subjectId, altSubjectId) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetSignedUpStudents/${studyYear}/${bupId}/${numSemestr}/${subjectId}/${altSubjectId}`,
                null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    getUnsignedStudents: async function (bupId, numSemestr, subjectId, altSubjectId, spnId) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetUnsignedStudents/${bupId}/${numSemestr}/${subjectId}/${altSubjectId}/${spnId}/${studyYear}/${facultyId}/${dictStudyLevelId}/${dictQualificationId}`,
                null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.responseJSON;
        }
    },
    postAssignStudents: async function (data) {
        try {
            return await this.apiCallback('POST', `AltSubjects/AssignStudents`, data, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    deleteStudentSelection: async function (id) {
        try {
            return await this.apiCallback('DELETE', `AltSubjects/DeleteStudentSelection/${id}`, null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    getAltSubjects: async function (bupId, numSemestr, subjectId) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetAltSubjects/${bupId}/${numSemestr}/${subjectId}`, null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    putChangeStudentSelection: async function (studentSelectionId, altSubjectId) {
        try {
            return await this.apiCallback('PUT', `AltSubjects/ChangeStudentSelection/${studentSelectionId}/${altSubjectId}`, null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    getAltSubjectsLimits: async function (studyYear) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetAltSubjectsLimits/${dictStudyLevelId}/${dictQualificationId}/${studyYear}`, null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    getTimeSelections: async function (studyYear) {
        try {
            return await this.apiCallback('GET', `AltSubjects/GetTimeSelections/${dictStudyLevelId}/${studyYear}`, null, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    postTimeSelection: async function (data) {
        try {
            return await this.apiCallback('POST', `AltSubjects/SaveTimeSelection/${dictStudyLevelId}/${studyYear}`, data, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    postAltSubjectLimits: async function (data) {
        try {
            return await this.apiCallback('POST', `AltSubjects/SaveLimits/${studyYear}`, data, 1);
        }
        catch (e) {
            console.log('Error: ', e);
            return e.statusText;
        }
    },
    apiCallback: async function (type, method, data, useAuth = 0) {
        if (useAuth == 1)
            await this.getToken();

        return Promise.resolve($.ajax({
            type: type,
            url: baseUrl + method,
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: (data === null) ? data : JSON.stringify(data),
            /*beforeSend: function (xhr) {
                if (useAuth == 1)
                    xhr.setRequestHeader("Authorization", "Bearer " + token.accessToken);
            },*/
            success: function (msg) {
                return msg;
            }
            , error: function (xhr, ajaxOptions, thrownError) {
                console.log(`${xhr.status} ${thrownError}`);
            }
        }));
    },
    apiCallbackForm: async function (type, method, data, useAuth = 0) {
        if (useAuth == 1)
            await this.getToken();

        return Promise.resolve($.ajax({
            type: type,
            url: baseUrl + method,
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            /*beforeSend: function (xhr) {
                if (useAuth == 1)
                    xhr.setRequestHeader("Authorization", "Bearer " + token.accessToken);
            },*/
            success: function (msg) {
                return msg;
            }
            , error: function (xhr, ajaxOptions, thrownError) {
                console.log(`${xhr.status} ${thrownError}`);
            }
        }));
    }
};