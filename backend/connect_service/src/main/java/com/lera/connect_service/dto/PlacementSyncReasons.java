package com.lera.connect_service.dto;

/** Values for {@link PlacementSyncResult#getReason()}. */
public final class PlacementSyncReasons {

    public static final String NO_STUDENT_LINKED = "NO_STUDENT_LINKED";
    public static final String INTERNAL_KEY_MISSING = "INTERNAL_KEY_MISSING";
    public static final String NO_PLACEMENT_IN_NOTES = "NO_PLACEMENT_IN_NOTES";
    public static final String SYNC_OK = "SYNC_OK";
    public static final String SYNC_UPDATED = "SYNC_UPDATED";
    public static final String ACADEMY_HTTP_ERROR = "ACADEMY_HTTP_ERROR";
    public static final String ACADEMY_UNREACHABLE = "ACADEMY_UNREACHABLE";

    private PlacementSyncReasons() {
    }
}
