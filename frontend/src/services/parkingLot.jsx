import httpClient from "./httpClient";

export const getParkingLotsByLocation = (lat, lon) => {
    return httpClient.get(`/api/slots/find-nearest/?lat=${lat}&lon=${lon}`);
};
