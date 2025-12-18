from fastapi import HTTPException, status

def assert_owned(resource: dict | None, user_uuid: str, name="resource"):
    if resource is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{name} not found"
        )

    if str(resource.get("user_uuid")) != str(user_uuid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden"
        )
