import json
import time
import urllib.request
import urllib.error


def http_post_json(url: str, data: dict, headers: dict | None = None) -> dict:
    payload = json.dumps(data).encode("utf-8")
    request_headers = {"Content-Type": "application/json"}
    if headers:
        request_headers.update(headers)
    req = urllib.request.Request(url, data=payload, headers=request_headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"POST {url} failed: {e.code} {e.reason} body={err_body}")


def http_get_json(url: str, headers: dict | None = None) -> dict | list:
    request_headers = {}
    if headers:
        request_headers.update(headers)
    req = urllib.request.Request(url, headers=request_headers, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            try:
                return json.loads(body) if body else {}
            except json.JSONDecodeError:
                return {"raw": body}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"GET {url} failed: {e.code} {e.reason} body={err_body}")


def main() -> None:
    base = "http://127.0.0.1:8000"

    # Unique identifiers for this run
    ts = str(int(time.time() * 1000))
    admin_email = f"admin_{ts}@example.com"
    user_email = f"user_{ts}@example.com"

    # 1) Register admin
    admin_reg = http_post_json(
        f"{base}/api/auth/register/",
        {
            "username": f"admin_{ts}",
            "password": "Admin!23456",
            "email": admin_email,
            "role": "admin",
        },
    )

    # 2) Register user
    user_reg = http_post_json(
        f"{base}/api/auth/register/",
        {
            "username": f"user_{ts}",
            "password": "User!23456",
            "email": user_email,
            "role": "customer",
        },
    )

    admin_access = admin_reg.get("access")
    user_access = user_reg.get("access")

    # 3) Admin creates a parking slot
    slot = http_post_json(
        f"{base}/api/slots/",
        {
            "slot_number": f"A1-{ts}",
            "floor": "1",
            "is_occupied": False,
        },
        headers={"Authorization": f"Bearer {admin_access}"},
    )
    slot_id = slot.get("id") or slot.get("pk") or slot.get("_id")

    # 4) User lists available slots
    available = http_get_json(
        f"{base}/api/slots/available/",
        headers={"Authorization": f"Bearer {user_access}"},
    )

    # 5) User creates a booking for the created slot (fallback to first available)
    chosen_slot_id = slot_id
    if not chosen_slot_id and isinstance(available, list) and available:
        chosen_slot_id = available[0].get("id")
    if not chosen_slot_id:
        raise RuntimeError("No available slot id to book")

    booking = http_post_json(
        f"{base}/api/bookings/",
        {"slot": chosen_slot_id},
        headers={"Authorization": f"Bearer {user_access}"},
    )
    booking_id = booking.get("id")

    # 6) User lists their bookings
    my_bookings = http_get_json(
        f"{base}/api/bookings/user/",
        headers={"Authorization": f"Bearer {user_access}"},
    )

    # 7) User cancels the booking
    cancel = http_post_json(
        f"{base}/api/bookings/{booking_id}/cancel/",
        {},
        headers={"Authorization": f"Bearer {user_access}"},
    )

    result = {
        "admin": {
            "email": admin_email,
            "access": admin_access,
            "refresh": admin_reg.get("refresh"),
            "user": admin_reg.get("user"),
        },
        "user": {
            "email": user_email,
            "access": user_access,
            "refresh": user_reg.get("refresh"),
            "user": user_reg.get("user"),
        },
        "created_slot": slot,
        "available_slots": available,
        "booking": booking,
        "cancel": cancel,
        "my_bookings": my_bookings,
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()


